# StageSync FA Engine

A standalone Python DFA-based controller for manual cue calling.

## Run the tests

Open a terminal in this `backend` folder and run:

```bash
python3 -m unittest -v test_fa_engine.py
```

## Try the engine

```python
from fa_engine import StageSyncFA

cues = ["LX1", "SQ1", "PR1", "AC1"]
engine = StageSyncFA(cues)

print(engine.snapshot())
print(engine.step("GO"))      # emits LX1
print(engine.step("GO"))      # emits SQ1
print(engine.step("HOLD"))    # pauses
print(engine.step("RESUME"))  # resumes
print(engine.step("GO"))      # emits PR1
```

`GO` emits exactly one next cue. `HOLD` and `RESUME` control the running
state. Invalid commands are rejected without changing the valid position.
`RESET` returns the machine to its initial state.
