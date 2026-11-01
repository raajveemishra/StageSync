"""StageSync Flask API: connects the frontend to the FA and PDA engines."""

from __future__ import annotations

import json
import threading
import re
import uuid
from dataclasses import asdict
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request

from fa_engine import StageSyncFA
from pda_engine import StageSyncPDA

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"
_lock = threading.RLock()
_performance: dict[str, StageSyncFA] = {}


def load_data() -> dict[str, Any]:
    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_data(data: dict[str, Any]) -> None:
    temporary = DATA_FILE.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    temporary.replace(DATA_FILE)


def find_production(data: dict[str, Any], production_id: str) -> dict[str, Any] | None:
    return next((p for p in data["productions"] if p["id"] == production_id), None)


def production_cues(data: dict[str, Any], production_id: str) -> list[dict[str, Any]]:
    """Return this production's cues in act/scene/group script order."""
    production = find_production(data, production_id)
    cues = [cue for cue in data.get("cues", []) if cue.get("productionId") == production_id]
    by_id = {cue.get("id"): cue for cue in cues}
    ordered_ids: list[str] = []
    if production:
        for act in production.get("acts", []):
            for scene in act.get("scenes", []):
                for group in scene.get("cueGroups", []):
                    ordered_ids.extend(group.get("cues", []))
    ordered = [by_id[cue_id] for cue_id in ordered_ids if cue_id in by_id]
    seen = {cue.get("id") for cue in ordered}
    ordered.extend(cue for cue in cues if cue.get("id") not in seen)
    return ordered


def get_fa(production_id: str) -> StageSyncFA | None:
    data = load_data()
    production = find_production(data, production_id)
    if production is None:
        return None
    cues = production_cues(data, production_id)
    # Rebuild if the saved cue sequence has changed since this engine was created.
    cached = _performance.get(production_id)
    if cached is None or getattr(cached, "cues", None) != cues:
        _performance[production_id] = StageSyncFA(cues)
    return _performance[production_id]


def production_structure_events(production: dict[str, Any]) -> list[str]:
    """Translate the saved hierarchy into PDA opening/closing input symbols."""
    events: list[str] = []
    for act in production.get("acts", []):
        events.append("OPEN_ACT")
        for scene in act.get("scenes", []):
            events.append("OPEN_SCENE")
            for _group in scene.get("cueGroups", []):
                events.extend(["OPEN_GROUP", "CLOSE_GROUP"])
            events.append("CLOSE_SCENE")
        events.append("CLOSE_ACT")
    return events


@app.after_request
def add_cors_headers(response):
    # The static frontend runs on localhost:8000 while Flask runs on :5000.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/api/<path:_path>", methods=["OPTIONS"])
def options(_path):
    return ("", 204)


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "StageSync API"})


@app.get("/api/productions")
def get_productions():
    with _lock:
        return jsonify(load_data()["productions"])


@app.get("/api/rehearsals")
def get_rehearsals():
    with _lock:
        return jsonify(load_data().get("rehearsals", []))


@app.get("/api/productions/<production_id>/cues")
def get_cues(production_id: str):
    with _lock:
        data = load_data()
        if find_production(data, production_id) is None:
            return jsonify({"error": "Production not found."}), 404
        return jsonify(production_cues(data, production_id))


@app.post("/api/productions")
def create_production():
    body = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Production title is required."}), 400

    with _lock:
        data = load_data()
        production = {
            "id": "p" + __import__("uuid").uuid4().hex[:8],
            "title": title,
            "playwright": "",
            "venue": "Venue to be confirmed",
            "opening": "",
            "status": "Planning",
            "acts": [],
        }
        data["productions"].append(production)
        save_data(data)
        return jsonify(production), 201


@app.post("/api/productions/<production_id>/acts")
def add_act(production_id: str):
    body = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Act title is required."}), 400
    with _lock:
        data = load_data()
        production = find_production(data, production_id)
        if production is None:
            return jsonify({"error": "Production not found."}), 404
        production["acts"].append({
            "id": "a" + __import__("uuid").uuid4().hex[:8],
            "title": title,
            "scenes": [],
        })
        save_data(data)
        return jsonify(production)


@app.post("/api/acts/<act_id>/scenes")
def add_scene(act_id: str):
    body = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Scene title is required."}), 400
    with _lock:
        data = load_data()
        for production in data["productions"]:
            for act in production.get("acts", []):
                if act["id"] == act_id:
                    act["scenes"].append({
                        "id": "s" + __import__("uuid").uuid4().hex[:8],
                        "title": title,
                        "cueGroups": [],
                    })
                    save_data(data)
                    return jsonify(production)
        return jsonify({"error": "Act not found."}), 404


@app.post("/api/scenes/<scene_id>/cue-groups")
def add_cue_group(scene_id: str):
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    if not name:
        return jsonify({"error": "Cue group name is required."}), 400
    with _lock:
        data = load_data()
        for production in data["productions"]:
            for act in production.get("acts", []):
                for scene in act.get("scenes", []):
                    if scene["id"] == scene_id:
                        scene.setdefault("cueGroups", []).append({
                            "id": "g" + __import__("uuid").uuid4().hex[:8],
                            "name": name,
                            "cues": [],
                        })
                        save_data(data)
                        return jsonify(production)
        return jsonify({"error": "Scene not found."}), 404


@app.post("/api/scenes/<scene_id>/cue-groups/<group_id>/cues")
def add_cue(scene_id: str, group_id: str):
    body = request.get_json(silent=True) or {}
    cue_type = str(body.get("type", "")).strip().title()
    title = str(body.get("title", "")).strip()
    detail = str(body.get("detail", "")).strip()
    trigger = str(body.get("trigger", "")).strip()
    requires = body.get("requires", [])
    allowed_types = {"Lighting": "LX", "Sound": "SQ", "Props": "PR", "Actor": "AC"}

    if cue_type not in allowed_types:
        return jsonify({"error": "Cue type must be Lighting, Sound, Props or Actor."}), 400
    if not title:
        return jsonify({"error": "Cue title is required."}), 400
    if not isinstance(requires, list) or any(not isinstance(item, str) for item in requires):
        return jsonify({"error": "Cue prerequisites must be a list of cue IDs."}), 400

    with _lock:
        data = load_data()
        target = None
        production = None
        for item in data["productions"]:
            for act in item.get("acts", []):
                for scene in act.get("scenes", []):
                    if scene.get("id") == scene_id:
                        group = next((g for g in scene.get("cueGroups", []) if g.get("id") == group_id), None)
                        if group is not None:
                            target, production = group, item
                            break
                if target:
                    break
            if target:
                break
        if target is None:
            return jsonify({"error": "Cue group not found in the supplied scene."}), 404

        existing = production_cues(data, production["id"])
        existing_ids = {cue.get("id") for cue in existing}
        if any(req not in existing_ids for req in requires):
            return jsonify({"error": "A prerequisite cue does not belong to this production."}), 400

        prefix = allowed_types[cue_type]
        numbers = [int(match.group(1)) for cue in data.get("cues", [])
                   if (match := re.fullmatch(re.escape(prefix) + r"(\d+)", str(cue.get("id", ""))))]
        cue_id = f"{prefix}{max(numbers, default=0) + 1}"
        cue = {
            "id": cue_id,
            "productionId": production["id"],
            "sceneId": scene_id,
            "groupId": group_id,
            "type": cue_type,
            "title": title,
            "detail": detail,
            "trigger": trigger,
            "requires": requires,
        }
        data.setdefault("cues", []).append(cue)
        target.setdefault("cues", []).append(cue_id)
        save_data(data)
        # A changed cue list must start a fresh FA sequence for this production.
        _performance.pop(production["id"], None)
        return jsonify(cue), 201


@app.get("/api/productions/<production_id>/structure/validate")
def validate_structure(production_id: str):
    with _lock:
        data = load_data()
        production = find_production(data, production_id)
        if production is None:
            return jsonify({"error": "Production not found."}), 404
        pda = StageSyncPDA()
        result = pda.validate(production_structure_events(production))
        result["productionId"] = production_id
        return jsonify(result)


@app.get("/api/productions/<production_id>/performance")
def performance_state(production_id: str):
    with _lock:
        engine = get_fa(production_id)
        if engine is None:
            return jsonify({"error": "Production not found."}), 404
        return jsonify(engine.snapshot())


@app.post("/api/productions/<production_id>/performance/command")
def performance_command(production_id: str):
    body = request.get_json(silent=True) or {}
    command = body.get("command", "")
    with _lock:
        engine = get_fa(production_id)
        if engine is None:
            return jsonify({"error": "Production not found."}), 404
        result = engine.step(command)
        payload = asdict(result)
        payload["snapshot"] = engine.snapshot()
        return jsonify(payload), (200 if result.accepted else 409)


@app.post("/api/productions/<production_id>/automata/fa-trace")
def fa_trace(production_id: str):
    """Run an isolated DFA command sequence against this production's cues."""
    body = request.get_json(silent=True) or {}
    commands = body.get("commands", [])
    if not isinstance(commands, list) or any(not isinstance(item, str) for item in commands):
        return jsonify({"error": "Commands must be a list of strings."}), 400

    with _lock:
        data = load_data()
        if find_production(data, production_id) is None:
            return jsonify({"error": "Production not found."}), 404
        engine = StageSyncFA(production_cues(data, production_id))
        trace = []
        for command in commands:
            before = engine.snapshot()
            result = engine.step(command)
            after = engine.snapshot()
            trace.append({
                "command": result.command,
                "accepted": result.accepted,
                "before_state": before["state"],
                "after_state": after["state"],
                "before_status": before["status"],
                "after_status": after["status"],
                "position_before": before["position"],
                "position_after": after["position"],
                "cue": result.cue,
                "message": result.message,
            })
        return jsonify({
            "productionId": production_id,
            "total_cues": len(engine.cues),
            "final_snapshot": engine.snapshot(),
            "trace": trace,
        })


@app.post("/api/automata/pda-trace")
def pda_trace():
    """Run an isolated PDA input sequence; no production data is modified."""
    body = request.get_json(silent=True) or {}
    symbols = body.get("symbols", [])
    if not isinstance(symbols, list) or any(not isinstance(item, str) for item in symbols):
        return jsonify({"error": "PDA symbols must be a list of strings."}), 400
    pda = StageSyncPDA()
    return jsonify(pda.validate(symbols))


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
