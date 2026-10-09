/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Medtronic site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (line refs approximate).
 *
 * NOTE: #container-5bd3147e2a wraps the ENTIRE page (header, hero, main,
 * investors, share bar) - it must NOT be removed. Only its header child
 * (.com-header-container) is removed.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / modals that can interfere with block matching
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk', // OneTrust cookie banner + preference center (line ~6453)
      '#contactusFormComp', // hidden contact-us trigger (line ~2017)
      '.xfpage.page.basicpage .contact-us-form-container', // contact-us modal forms (lines ~2020-6240)
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable chrome
    WebImporter.DOMUtils.remove(element, [
      '.com-header-container', // header: skip buttons, logo, search, mega nav, breadcrumb (lines 7-1496)
      'footer', // global footer, migrated separately (line ~6240)
      '.xfpage.page.basicpage', // remaining experience-fragment modal wrappers after main
      '.share', // share/print/social bar (line ~1943)
      '.warn-on-leave', // empty leave-site warning component (line ~2012)
      '.disclaimer', // empty disclaimer component (line ~1888)
      '.ghost', // empty AEM ghost placeholders in main (lines ~1567-1570)
      '.hero-main-content .dom', // empty freeform DOM container in hero (line ~1535)
      'button.hero-jon__pause', // video pause/play control (line ~1511)
      'iframe.ot-text-resize', // OneTrust helper iframe
      // Medallia survey invite injected at runtime (not in cleaned.html)
      '[id^="kampyle"]', '[class*="kampyle"]', '[id*="medallia" i]', '[class*="medallia" i]',
    ]);
    removeSurveyInvite(element);
  }
}

/**
 * Removes the runtime Medallia "Your feedback matters!" survey invite, whose
 * markup has no stable class. Walks up from the matching text to the outermost
 * ancestor that holds nothing but the invite.
 */
function removeSurveyInvite(element) {
  [...element.querySelectorAll('strong, b, p, div')]
    .filter((el) => /^Your feedback matters!?$/i.test(el.textContent.trim()))
    .forEach((el) => {
      let target = el;
      while (target.parentElement && target.parentElement !== element
        && /^Your feedback matters/i.test(target.parentElement.textContent.trim())) {
        target = target.parentElement;
      }
      target.remove();
    });
}
