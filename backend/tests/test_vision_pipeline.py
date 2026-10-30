import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.qloo import get_hobby_recommendations

TINY_JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="


class TestVisionPipeline(unittest.IsolatedAsyncioTestCase):
    async def test_claude_vision_tool_use_success(self):
        expected_tags = [
            "yellow locker organizer",
            "heart-framed pet photos",
            "pastel sticky notes",
        ]
        expected_vibe = "Bright yellow locker wall with heart-framed pet photos and pastel sticky notes."

        mock_analysis = {
            "tags": expected_tags,
            "vibe_summary": expected_vibe,
            "archetype": "NOSTALGIC STICKER COLLAGE CURATOR",
            "per_image_captions": ["Sunny locker", "Teal stickers"],
            "qloo_seeds": {
                "tag_queries": ["kawaii", "collage art"],
                "entity_queries": ["Sanrio", "Tamagotchi"],
            },
            "custom_hobbies": [],
        }

        with patch("services.qloo.analyze_with_claude_vision", new=AsyncMock(return_value=(mock_analysis, "claude-haiku-5-5"))), \
             patch("services.qloo.get_api_key", return_value=""):
            res = await get_hobby_recommendations(
                tags=[],
                images=[{"name": "test.jpg", "dataUrl": TINY_JPEG}],
            )
            self.assertEqual(res["signal_source"], "claude_vision")
            self.assertEqual(res["aesthetic_dna"]["tags"], expected_tags)
            self.assertEqual(res["aesthetic_dna"]["vibe_summary"], expected_vibe)

    async def test_fallback_no_vision_when_claude_fails(self):
        with patch("services.qloo.analyze_with_claude_vision", new=AsyncMock(return_value=(None, "claude-haiku-5-5"))), \
             patch("services.qloo.get_api_key", return_value=""):
            res = await get_hobby_recommendations(
                tags=[],
                images=[{"name": "test.jpg", "dataUrl": TINY_JPEG}],
            )
            self.assertEqual(res["signal_source"], "fallback_no_vision")
            for forbidden in ("botanical", "ceramics & clay", "analog photography"):
                self.assertNotIn(forbidden, res["aesthetic_dna"]["tags"])
            self.assertEqual(res["aesthetic_dna"]["tags"], ["music", "film", "books"])
            self.assertIn("fallback_no_vision", res["aesthetic_dna"]["vibe_summary"])
            self.assertIn("Fallback sin visión", res["aesthetic_dna"]["vibe_summary"])
            self.assertNotIn("Your visual scrapbook blends", res["aesthetic_dna"]["vibe_summary"])


if __name__ == "__main__":
    unittest.main()
