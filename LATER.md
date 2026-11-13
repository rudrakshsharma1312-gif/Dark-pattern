# DarkGuard AI - LATER (Post-Hackathon Roadmap)

Items and architectural enhancements logged for future development:

1. **Context-Aware Decline Classification (Fixing "No thanks" False Positive):**
   - The phrase `"No thanks"` in isolation triggered false positives on clean pages when not paired with a guilt cue.
   - Future enhancement: Feed parent container or sibling button context into the classifier so it only scores decline options that contain comparative or self-referential language.

2. **Hierarchical / Calibrated Thresholds:**
   - Instead of static scalar cutoffs, use isotonic regression or Platt scaling to output well-calibrated confidence scores that smoothly integrate into `risk.js`.

3. **Multi-lingual / Non-English UI Tokenization:**
   - Expand the tokenization regex and vocabulary to accommodate Euro/Rupee/Yen-denominated e-commerce copy and localized dark pattern datasets.

4. **Transformer-Distilled Embeddings (WebAssembly / ONNX Runtime Web):**
   - Port a quantized MiniLM or MobileBERT model to run on client-side ONNX WebAssembly for richer semantic and sarcastic copy detection.

5. **Multi-Page Flow Tracking:**
   - Detect sneak-into-basket and subscription traps that span the product page, cart, and final payment screen.
