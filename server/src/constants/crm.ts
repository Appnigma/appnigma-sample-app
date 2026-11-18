// Enough for a small account in one page; the SDK takes up to 100.
const CRM_PAGE_SIZE = 50;

// Recorded calls come from Gong in this sample.
const CALL_PLATFORM = "gong";

// A deal create names a key of this app's own, so sending it again updates the same deal.
const DEAL_MATCH_KEY_PREFIX = "acme-desk-deal:";

export { CALL_PLATFORM, CRM_PAGE_SIZE, DEAL_MATCH_KEY_PREFIX };
