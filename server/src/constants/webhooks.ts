// Where this app's server takes the events Appnigma sends it.
const WEBHOOK_RECEIVER_PATH = "/webhooks/appnigma";

const WEBHOOK_SIGNATURE_HEADER = "Appnigma-Signature";

const WEBHOOK_BODY_LIMIT = "1mb";

const RECEIVED_EVENTS_LIMIT = 50;

const EVENTS_PAGE_SIZE = 20;

export { EVENTS_PAGE_SIZE, RECEIVED_EVENTS_LIMIT, WEBHOOK_BODY_LIMIT, WEBHOOK_RECEIVER_PATH, WEBHOOK_SIGNATURE_HEADER };
