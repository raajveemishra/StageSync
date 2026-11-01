"""
StageSync DFA-based performance controller.

The DFA validates the Stage Manager's commands and tracks the performance
position. An accepted GO emits exactly one cue from the supplied cue sequence.

The command-state machine is a DFA. The cue emission is an output mapping
attached to accepted GO transitions (a practical finite-state controller).
"""

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Union


@dataclass
class TransitionResult:
    accepted: bool
    command: str
    state: str
    status: str
    cue: Optional[Dict[str, Any]] = None
    message: str = ""


class StageSyncFA:
    """Deterministic finite-state controller for manual cue calling."""

    VALID_COMMANDS = {"GO", "HOLD", "RESUME", "RESET"}

    def __init__(self, cues: Iterable[Union[str, Dict[str, Any]]]):
        self.cues: List[Dict[str, Any]] = []
        for item in cues:
            if isinstance(item, str):
                self.cues.append({"id": item, "title": item})
            else:
                self.cues.append(dict(item))

        self.position = 0  # Number of cues successfully called.
        self.held = False
        self.history: List[TransitionResult] = []

    @property
    def completed(self) -> bool:
        return self.position >= len(self.cues)

    @property
    def status(self) -> str:
        if self.completed:
            return "complete"
        if self.held:
            return "held"
        if self.position == 0:
            return "standby"
        return "running"

    @property
    def state(self) -> str:
        if self.completed:
            return "q_accept"
        if self.held:
            return f"h{self.position}"
        return f"q{self.position}"

    @property
    def next_cue(self) -> Optional[Dict[str, Any]]:
        if self.completed:
            return None
        return self.cues[self.position]

    @property
    def current_cue(self) -> Optional[Dict[str, Any]]:
        if self.position == 0:
            return None
        return self.cues[self.position - 1]

    def step(self, command: str) -> TransitionResult:
        """Process one command and return the deterministic transition result."""
        command = str(command).strip().upper()

        if command == "RESET":
            self.position = 0
            self.held = False
            result = self._result(True, command, "Show reset. Standing by.")
            self.history.append(result)
            return result

        if command not in self.VALID_COMMANDS:
            return self._reject(command, f"Unknown command: {command!r}.")

        if command == "GO":
            if self.held:
                return self._reject(command, "The show is on hold. Resume before calling GO.")
            if self.completed:
                return self._reject(command, "All cues have been called. The performance is complete.")

            cue = self.cues[self.position]
            self.position += 1
            result = self._result(
                True,
                command,
                f"Accepted. Called {cue.get('id', 'cue')}: {cue.get('title', '')}".strip(),
                cue=cue,
            )
            self.history.append(result)
            return result

        if command == "HOLD":
            if self.held:
                return self._reject(command, "The show is already on hold.")
            if self.position == 0:
                return self._reject(command, "The show has not started; there is nothing to hold.")
            if self.completed:
                return self._reject(command, "The performance is already complete.")

            self.held = True
            result = self._result(True, command, "Performance held.")
            self.history.append(result)
            return result

        if command == "RESUME":
            if not self.held:
                return self._reject(command, "The show is not on hold.")
            self.held = False
            result = self._result(True, command, "Performance resumed. Ready for the next cue.")
            self.history.append(result)
            return result

        # Defensive fallback; all commands are handled above.
        return self._reject(command, "Command is not valid in the current state.")

    def snapshot(self) -> Dict[str, Any]:
        """Return a JSON-serialisable view for the Flask API."""
        return {
            "state": self.state,
            "status": self.status,
            "position": self.position,
            "total_cues": len(self.cues),
            "current_cue": self.current_cue,
            "next_cue": self.next_cue,
            "completed": self.completed,
        }

    def _result(
        self,
        accepted: bool,
        command: str,
        message: str,
        cue: Optional[Dict[str, Any]] = None,
    ) -> TransitionResult:
        return TransitionResult(
            accepted=accepted,
            command=command,
            state=self.state,
            status=self.status,
            cue=cue,
            message=message,
        )

    def _reject(self, command: str, message: str) -> TransitionResult:
        # Rejected input never changes position or held status.
        result = self._result(False, command, message)
        self.history.append(result)
        return result
