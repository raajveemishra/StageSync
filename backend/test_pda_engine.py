
import unittest
from pda_engine import StageSyncPDA, BOTTOM_MARKER


class TestStageSyncPDA(unittest.TestCase):

    def setUp(self):
        self.pda = StageSyncPDA()

    def test_valid_nesting(self):
        result = self.pda.validate([
            "OPEN_ACT",
            "OPEN_SCENE",
            "OPEN_GROUP",
            "CLOSE_GROUP",
            "CLOSE_SCENE",
            "CLOSE_ACT"
        ])
        self.assertTrue(result["accepted"])
        self.assertEqual(result["stack"], [BOTTOM_MARKER])

    def test_wrong_closing_order(self):
        result = self.pda.validate([
            "OPEN_ACT",
            "OPEN_SCENE",
            "CLOSE_ACT"
        ])
        self.assertFalse(result["accepted"])
        self.assertIn("Mismatched", result["message"])
        self.assertEqual(result["stack"], ["$", "ACT", "SCENE"])

    def test_unclosed_structure(self):
        result = self.pda.validate([
            "OPEN_ACT",
            "OPEN_SCENE",
            "CLOSE_SCENE"
        ])
        self.assertFalse(result["accepted"])
        self.assertIn("Unclosed", result["message"])

    def test_extra_closing_symbol(self):
        result = self.pda.validate(["CLOSE_ACT"])
        self.assertFalse(result["accepted"])
        self.assertIn("nothing is open", result["message"])

    def test_unknown_symbol(self):
        result = self.pda.validate([
            "OPEN_ACT",
            "OPEN_STAGE"
        ])
        self.assertFalse(result["accepted"])
        self.assertIn("Unknown input", result["message"])

    def test_arbitrarily_nested_groups(self):
        result = self.pda.validate([
            "OPEN_ACT",
            "OPEN_SCENE",
            "OPEN_GROUP",
            "OPEN_GROUP",
            "OPEN_GROUP",
            "CLOSE_GROUP",
            "CLOSE_GROUP",
            "CLOSE_GROUP",
            "CLOSE_SCENE",
            "CLOSE_ACT"
        ])
        self.assertTrue(result["accepted"])
        self.assertEqual(result["stack"], [BOTTOM_MARKER])

    def test_rejection_does_not_pop_wrong_symbol(self):
        result = self.pda.validate([
            "OPEN_ACT",
            "OPEN_SCENE",
            "CLOSE_ACT"
        ])
        self.assertFalse(result["accepted"])
        self.assertEqual(result["stack"], ["$", "ACT", "SCENE"])

    def test_reset_after_rejection(self):
        self.pda.validate(["CLOSE_ACT"])
        self.pda.reset()
        self.assertFalse(self.pda.rejected)
        self.assertEqual(self.pda.stack, [BOTTOM_MARKER])

        result = self.pda.validate([
            "OPEN_ACT",
            "CLOSE_ACT"
        ])
        self.assertTrue(result["accepted"])


if __name__ == "__main__":
    unittest.main()
