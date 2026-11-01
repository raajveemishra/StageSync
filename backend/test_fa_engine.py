"""Run with: python3 -m unittest -v test_fa_engine.py"""

import unittest
from fa_engine import StageSyncFA


class TestStageSyncFA(unittest.TestCase):
    def setUp(self):
        self.fa = StageSyncFA(["LX1", "SQ1", "PR1"])

    def test_go_emits_exactly_one_next_cue(self):
        first = self.fa.step("GO")
        self.assertTrue(first.accepted)
        self.assertEqual(first.cue["id"], "LX1")
        self.assertEqual(self.fa.snapshot()["position"], 1)

        second = self.fa.step("GO")
        self.assertTrue(second.accepted)
        self.assertEqual(second.cue["id"], "SQ1")
        self.assertEqual(self.fa.snapshot()["position"], 2)

    def test_hold_and_resume(self):
        self.fa.step("GO")
        held = self.fa.step("HOLD")
        self.assertTrue(held.accepted)
        self.assertEqual(self.fa.status, "held")

        blocked_go = self.fa.step("GO")
        self.assertFalse(blocked_go.accepted)
        self.assertEqual(self.fa.snapshot()["position"], 1)

        resumed = self.fa.step("RESUME")
        self.assertTrue(resumed.accepted)
        next_cue = self.fa.step("GO")
        self.assertEqual(next_cue.cue["id"], "SQ1")

    def test_invalid_commands_do_not_change_state(self):
        before = self.fa.snapshot()
        result = self.fa.step("JUMP")
        self.assertFalse(result.accepted)
        self.assertEqual(self.fa.snapshot(), before)

    def test_hold_before_start_is_rejected(self):
        result = self.fa.step("HOLD")
        self.assertFalse(result.accepted)
        self.assertEqual(self.fa.status, "standby")

    def test_completion_and_extra_go_rejection(self):
        for _ in range(3):
            result = self.fa.step("GO")
            self.assertTrue(result.accepted)

        self.assertTrue(self.fa.completed)
        self.assertEqual(self.fa.status, "complete")

        extra = self.fa.step("GO")
        self.assertFalse(extra.accepted)
        self.assertEqual(self.fa.snapshot()["position"], 3)

    def test_reset_returns_to_initial_state(self):
        self.fa.step("GO")
        self.fa.step("HOLD")
        result = self.fa.step("RESET")
        self.assertTrue(result.accepted)
        self.assertEqual(self.fa.state, "q0")
        self.assertEqual(self.fa.status, "standby")


if __name__ == "__main__":
    unittest.main()
