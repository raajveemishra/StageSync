"""StageSync PDA for validating nested production structures.

Input symbols are OPEN_ACT/CLOSE_ACT, OPEN_SCENE/CLOSE_SCENE, and
OPEN_GROUP/CLOSE_GROUP. Opening symbols push their type onto the stack;
closing symbols must match and pop the stack top.

The stack starts with a bottom marker ($). A sequence is accepted only when
all inputs are valid and the stack has returned to that marker.
"""

from dataclasses import dataclass
from typing import Iterable, List, Optional


BOTTOM_MARKER = "$"
OPEN_TO_TYPE = {
    "OPEN_ACT": "ACT",
    "OPEN_SCENE": "SCENE",
    "OPEN_GROUP": "GROUP",
}
CLOSE_TO_TYPE = {
    "CLOSE_ACT": "ACT",
    "CLOSE_SCENE": "SCENE",
    "CLOSE_GROUP": "GROUP",
}
VALID_SYMBOLS = set(OPEN_TO_TYPE) | set(CLOSE_TO_TYPE)


@dataclass
class PDAStep:
    symbol: str
    accepted: bool
    stack: List[str]
    message: str


class StageSyncPDA:
    """Deterministic pushdown automaton for nested acts/scenes/cue groups."""

    def __init__(self):
        self.stack: List[str] = [BOTTOM_MARKER]
        self.steps: List[PDAStep] = []
        self.rejected = False
        self.error: Optional[str] = None

    @property
    def is_balanced(self) -> bool:
        return not self.rejected and self.stack == [BOTTOM_MARKER]

    def reset(self) -> None:
        self.stack = [BOTTOM_MARKER]
        self.steps = []
        self.rejected = False
        self.error = None

    def process(self, symbol: str) -> PDAStep:
        """Consume one input symbol. Invalid input never mutates the stack."""
        token = str(symbol).strip().upper()

        if self.rejected:
            return self._record(token, False, "Sequence already rejected. Reset before continuing.")

        if token not in VALID_SYMBOLS:
            self.rejected = True
            self.error = f"Unknown input symbol: {token!r}."
            return self._record(token, False, self.error)

        if token in OPEN_TO_TYPE:
            element_type = OPEN_TO_TYPE[token]
            self.stack.append(element_type)
            return self._record(token, True, f"Opened {element_type.lower()}; pushed onto stack.")

        expected_type = CLOSE_TO_TYPE[token]
        if len(self.stack) == 1:
            self.rejected = True
            self.error = f"Cannot close {expected_type.lower()}: nothing is open."
            return self._record(token, False, self.error)

        actual_type = self.stack[-1]
        if actual_type != expected_type:
            self.rejected = True
            self.error = (
                f"Mismatched closing symbol: tried to close {expected_type.lower()} "
                f"while {actual_type.lower()} is still open."
            )
            return self._record(token, False, self.error)

        self.stack.pop()
        return self._record(token, True, f"Closed {expected_type.lower()}; popped from stack.")

    def validate(self, symbols: Iterable[str]) -> dict:
        """Validate a complete sequence and report acceptance/rejection."""
        self.reset()
        for symbol in symbols:
            step = self.process(symbol)
            if not step.accepted:
                break

        if not self.rejected and self.stack != [BOTTOM_MARKER]:
            open_items = ", ".join(item.lower() for item in self.stack[1:])
            self.rejected = True
            self.error = f"Unclosed structure(s): {open_items}."

        accepted = not self.rejected and self.stack == [BOTTOM_MARKER]
        return {
            "accepted": accepted,
            "status": "accepted" if accepted else "rejected",
            "stack": self.stack.copy(),
            "steps": [
                {"symbol": s.symbol, "accepted": s.accepted,
                 "stack": s.stack.copy(), "message": s.message}
                for s in self.steps
            ],
            "message": "Structure is properly nested." if accepted else (self.error or "Invalid structure."),
        }

    def _record(self, symbol: str, accepted: bool, message: str) -> PDAStep:
        step = PDAStep(symbol, accepted, self.stack.copy(), message)
        self.steps.append(step)
        return step
