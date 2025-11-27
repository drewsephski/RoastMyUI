# Roast My UI - Enhanced System Prompt

## Summary of Changes

I've enhanced the roasting system to produce better, more personalized results based on your requirements:

### 1. **New Data Fields Added**

Updated `RoastData` interface with:

- `visualCrimes: string[]` - Specific visual issues detected (2 items)
- `bestPart: string` - What's surprisingly good (1 sentence)
- `worstPart: string` - The absolute worst part (1 sentence)

### 2. **Streamlined System Prompt**

**Before:** Verbose 100+ line prompt with extensive examples and slang lists
**After:** Concise 45-line prompt focused on:

- Analyzing what's ACTUALLY in the screenshot
- Keeping roasts SHORT (40-60 words vs 50-90)
- Using natural language instead of forced slang
- Being SPECIFIC to each site

### 3. **Key Improvements**

#### Shorter & More Personalized

- Reduced roast length from 50-90 words to 40-60 words
- Emphasis on describing specific visual elements visible in screenshot
- Examples: "that giant navbar", "the microscopic CTA", "those three competing gradients"

#### Better Tone Guidance

**Good examples:**

- "this hero section is 80% navbar and 20% regret"
- "giving 'I discovered gradients yesterday' energy"

**Bad examples (to avoid):**

- "mid af npc energy delulu fr fr no cap"
- "ts aint tuff bruh caught in 4k"

#### Accuracy Over Comedy

- Focus on REAL visual issues the AI can see
- Match tone to site type (playful for fun brands, harsher for corporate)
- Honest scoring with decimals (not inflated or deflated)

### 4. **Updated UI Display**

The `RoastResult` component now shows:

- **Visual Crimes Detected** section with animated indicator
- **Surprisingly Good** / **Absolute Worst** cards
- All new fields displayed in a clean, organized layout

## Next Steps to Consider

Based on your original ideas for virality:

1. **Roast Categories** - Track "Most Roasted Issues" across all sites
2. **Before/After Challenges** - Encourage re-roasting after improvements
3. **Leaderboard** - Best and worst scores for competitive engagement
4. **Designer Reactions** - Optional tagging/sharing features

## Testing

To test the improvements:

1. Roast a few different types of sites (SaaS, portfolio, e-commerce)
2. Check that roasts are:
   - Shorter (40-60 words)
   - More specific to the actual screenshot
   - Using natural language vs forced slang
   - Accurately scored

The system should now feel like "expert feedback wrapped in entertainment" rather than "random insults with design words sprinkled in."
