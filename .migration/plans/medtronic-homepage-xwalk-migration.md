# Medtronic Homepage Migration Plan (EDS + Universal Editor)

## Goal
Build an Edge Delivery Services homepage that authors can edit in Universal Editor, based on **https://www.medtronic.com/en-us/index.html**. The existing EDS demo (**https://main--eds-xwalk-medtronic--pradeepgupta-eds.aem.live/demo/us/en-us/**) is a guide for which blocks to use, how sections are split up, and how content is modeled.

## Scope
- **Page body:** every content section on the Medtronic US homepage (hero, feature/promo areas, cards, columns, news/stories, CTAs, etc.)
- **Header / navigation:** the Medtronic header and mega menu, on desktop and mobile
- **Footer:** the Medtronic footer (link groups, social links, legal text)
- **Design styling:** fonts, colors, spacing, and per-block styling matched to the original site

## Project Context
- Project type: xwalk (Universal Editor). Content comes from AEM author (`/content/medtronic-demo`)
- Existing blocks: hero, cards, columns, fragment, header, footer
- New blocks or block variants will each get a Universal Editor model, definition and filter, so authors can edit them

## Approach
1. **Analyze the page.** Capture the Medtronic homepage's structure, sections and block candidates, along with screenshots and cleaned HTML.
2. **Compare with the EDS demo.** Check how the demo split up its sections and which blocks it used (e.g. hero and carousel variants, cards, columns, teasers). Reuse that structure where it fits, so the content model is consistent.
3. **Map blocks.** Assign each section to an existing block or a new variant. Prefer existing boilerplate blocks and only create new ones when needed.
4. **Generate blocks.** Create or extend block JS/CSS and the Universal Editor JSON models (`_{block}.json`), then rebuild the combined component files.
5. **Build the import.** Generate parsers and transformers, bundle the import script, and run the bulk import to create the homepage content.
6. **Migrate the design.** Extract design tokens (fonts, colors, spacing) into the global styles, then style each block to match the original.
7. **Migrate header and footer.** Run the navigation migration (desktop, mobile, mega menu) and the footer migration.
8. **Validate.** Compare the preview with the original page and fix differences in layout, content and styling. Run lint and check that the Universal Editor models are valid.

## Checklist
- [ ] Confirm project type (xwalk) and the block library for this project
- [ ] Analyze the Medtronic homepage (sections, block variants, screenshots, cleaned HTML)
- [ ] Review the EDS demo page for block choices and section structure to reuse
- [ ] Map each section to blocks or variants in the page template
- [ ] Generate or extend blocks, including Universal Editor models, definitions and filters
- [ ] Run `npm run build:json` to regenerate the combined component files
- [ ] Generate import parsers and transformers
- [ ] Bundle the import script and run the bulk import for the homepage
- [ ] Migrate global design tokens (fonts, colors, spacing, buttons)
- [ ] Style each block to match the original
- [ ] Migrate the header and mega menu (desktop and mobile)
- [ ] Migrate the footer
- [ ] Compare the preview with the original and fix gaps
- [ ] Run `npm run lint` and fix model and code issues
- [ ] Summarize the result: blocks created, page sections, and any known differences

## Notes / Risks
- Medtronic.com may block automated scraping. If it does, the scraper will fall back to bot-protection handling.
- Mega menu content that only appears on hover needs to be captured item by item.
- Images will be referenced from the import. The final asset location in AEM DAM (`/content/dam/medtronic-demo`) may need to be confirmed when content is uploaded to the author.

> Running this plan needs Execute mode. Once you switch, I'll go through the checklist in order.
