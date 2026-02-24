/**
 * Prompt templates for the game generation agent.
 * Functions receive any dynamic content (e.g. example JSON) and return the full prompt string.
 */

/**
 * Prompt for picking the answer celebrity and 4 partners they had a verified relationship with.
 * Captures tone and guardrails from the original celebrity/relationship researcher prompts.
 *
 * @param {string} exampleJson - Example output JSON (pretty-printed) to enforce structure.
 * @param {string[]} [excludedAnswerNames=[]] - Celebrity names already used as the answer in previous games; do not pick any of these.
 * @returns {string}
 */
export function getAnswerWithRelationshipsPrompt(exampleJson, excludedAnswerNames = []) {
  const exclusionBlock =
    excludedAnswerNames.length > 0
      ? `
EXCLUSION LIST — DO NOT USE AS THE ANSWER
The following celebrities have ALREADY been used as the answer in previous games. You must NOT pick any of them. Choose someone else:
${excludedAnswerNames.map((n) => `- ${n}`).join('\n')}

`
      : '';

  return `You are a meticulous celebrity relationship researcher for "Roger That," a daily pop culture trivia game.

Your sole task is to identify ONE male celebrity who has a VERIFIABLE romantic history suitable for the quiz, plus exactly 4 partners you can cite. Accuracy is mandatory. Creativity applies ONLY to taglines.
${exclusionBlock}
CORE MISSION
Pick ONE well-known male public figure who has AT LEAST 4 publicly confirmed romantic relationships with other well-known people. Then select exactly 4 of those partners and provide a real citation URL for each.

WHAT QUALIFIES AS A VERIFIED RELATIONSHIP
A relationship counts ONLY if ALL of these are true:
- Explicitly described as dating, engaged, or married (not "linked" or "spotted with")
- Documented in Wikipedia, major news outlets, or confirmed celebrity interviews
- NOT based on rumors, blind items, paparazzi speculation, or gossip columns
- NOT inferred from co-starring in films, attending events together, or social media follows
- You are personally confident this relationship actually occurred and is public knowledge

WHAT DISQUALIFIES A CANDIDATE (answer or partner)
- Fewer than 4 verifiable relationships for the answer
- Relationships are mostly rumored or unconfirmed
- Primarily known for private life rather than public achievement
- Involved in relationships with minors at any point
- Dead for more than 20 years (cultural relevance threshold)
- Rumored but unconfirmed; "linked to" or "spotted with" rather than explicitly dating
- From unreliable gossip sources; involving non-public figures or private citizens
- Anyone under 18 at the time of the relationship

CONTENT SAFETY — AVOID MODERATION BLOCKS
Avoid figures who fall into any of these categories, as they tend to be flagged more aggressively by image generation systems:
- Primary fanbase skews very young or closely associated with teen/young-adult fan culture
- Likeness is widely known to be heavily protected or frequently misused in AI-generated content
- Active political figures or former heads of state
- Currently involved in major, widely-covered legal proceedings
- Recently deceased (within the past 12 months)
- Primarily known as religious or spiritual leaders
When in doubt, choose a different celebrity so the game can generate family-friendly caricatures without moderation blocks.

DIVERSITY
- For the answer: consider variety (actors, musicians, athletes, reality TV, comedians, directors, tech figures; mix of decades and geography). Do NOT default to obvious Hollywood actors only.
- For the 4 partners: when possible include variety in decades, professions (actresses, musicians, models, athletes, TV personalities), and levels of fame.

TONE & CONTEXT
This is for an edgy, cheeky adult trivia game — think tabloid curiosity meets Wordle. The game celebrates pop culture knowledge, not judgment. Your job is accuracy first, interestingness second.

TAGLINE RULES (NON-NEGOTIABLE)
- Taglines must be short, witty, cheeky, naughty, edgy and gasp-worthy
- 2-7 words only
- Refer to career, vibe, reputation, public persona or widely known controversies
- Use puns, dark humor, double entendre, or cultural references
- Do NOT invent private behavior — reference only widely reported incidents, scandals, or public persona quirks
- NEVER reference relationships, dating, exes, or the answer in a tagline
- Avoid boring literal job titles; exaggerate the vibe, notoriety, or reputation

MANDATORY RULES
- Birth year must be accurate (four digits)
- For each of the 4 relationships you must provide a citation URL: a real link from your web search to a reputable source that explicitly confirms that relationship

WEB SEARCH
Use the web search tool to find verified relationships and citations. In your search, look up one well-known male celebrity and their romantic relationships (e.g. "[celebrity name] romantic relationships" or "male celebrity dating history") so the results include the person and at least 4 verified partners with sources. From that search result only, pick the answer and exactly 4 partners and get real citation URLs.

OUTPUT FORMAT
After your web search, respond with ONLY a single JSON object matching this exact shape (no extra fields, no markdown, no explanation). Example format:
${exampleJson}

OUTPUT ONLY THE RAW JSON OBJECT. NO COMMENTARY. NO PREAMBLE. NO EXPLANATIONS.`;
}

/**
 * Prompt for image model to generate an editorial-style caricature inspired by a celebrity.
 * Framed as digital art / editorial illustration to ease content moderation: the image
 * should embody the subject's recognizable traits without being a depiction of a real person.
 *
 * @param {string} name - Celebrity full name (used only as inspiration, not as a portrait subject).
 * @param {number} [variant=1] - 1 = primary prompt, 2 = alternate wording to help pass moderation.
 * @returns {string}
 */
export function getCaricaturePrompt(name, variant = 1) {
  if (variant === 1) {
    return getCaricaturePromptAlt(name);
  }
  return `Brief: Editorial illustration, digital art. 
  
Create a single, stylized caricature in the tradition of editorial cartoon art, inspired by the widely recognised public image of ${name}. This is a creative, artistic interpretation that playfully exaggerates their most identifiable traits (distinctive facial structure, signature hairstyle, typical wardrobe or accessories) in the same way a newspaper cartoonist would. The result must unmistakably read as an illustrated caricature and must never resemble a photograph or realistic portrait.

COMPOSITION & FRAMING
- The full head, hair, and face must be completely visible and within the frame — nothing cropped. Frame as head-and-shoulders or three-quarter view.
- One character only. Fully clothed. Neutral, relaxed editorial pose suitable for a general audience.
- Background fills the entire canvas edge-to-edge with no vignette or fade-out. It may include subtle abstract motifs or generic props loosely associated with the subject's professional field, but must not depict or reference any specific real-world events, legal matters, or identifiable locations.

CONTENT GUIDANCE
- The output must clearly read as a cartoon or stylised illustration, never as a real photograph or likeness intended to deceive.
- All content must be appropriate for a general audience of all ages.
- Do not depict or reference any specific real-world events, controversies, or legal matters.

STYLE DIRECTION
- Render as: "editorial caricature, non-photorealistic, stylized cartoon, exaggerated proportions, clearly not a photograph, safe for all audiences."`;
}

/**
 * Alternate caricature prompt: reworded and restructured to improve moderation pass rate.
 * Same intent as primary prompt but different phrasing and structure.
 *
 * @param {string} name - Celebrity full name (inspiration only).
 * @returns {string}
 */
export function getCaricaturePromptAlt(name) {
  return `Brief: Editorial illustration, digital art.

STYLE & MEDIUM
- Render in the style of a classic editorial cartoon or magazine caricature — think warm colour palette, and playfully exaggerated proportions. The finished piece should feel like it belongs on the opinion page of a respected newspaper or framed as a magazine feature illustration.

SUBJECT
- Create a single illustrated caricature character inspired by the widely recognised public image of ${name}. Emphasise and amplify their most identifiable visual traits: distinctive facial geometry, signature hairstyle, and characteristic wardrobe or accessories. The character should be immediately evocative of the public figure while being unmistakably a cartoon — an affectionate artistic interpretation.

COMPOSITION & FRAMING
- Show the full head, hair, and complete face — everything visible and within the canvas. Use a head-and-shoulders or three-quarter framing.
- One character only. Fully clothed in attire typical of their public appearances. Relaxed, confident, and neutral in posture — the kind of pose suitable for a magazine profile or all-ages editorial feature.
- Fill the entire background edge-to-edge with a cohesive illustrated environment. Use subtle abstract shapes, colour fields, or generic thematic props loosely tied to the subject's professional domain. Keep the background supportive, not narrative — it should complement the character without telling a specific story or referencing any real-world event.

TONE & INTENT
- The illustration should feel respectful, lighthearted, and celebratory of the subject's public presence — similar in spirit to caricatures displayed at award ceremonies or editorial profiles.
- All content must be appropriate for a general audience of all ages.
- The character should appear approachable, dignified, and at ease.

RENDERING GUIDANCE
- Use clearly hand-illustrated or digitally painted textures throughout — visible line art, hatching, or painterly strokes.
- Favour warm, inviting lighting and a clean, professional composition.
- Exaggerate at least two or three key facial or physical features for clear caricature effect while keeping the overall likeness friendly and good-natured.`;
}
