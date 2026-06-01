/** ISO timestamp for the start (UTC) of the current calendar month. */
export function monthStartISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Unix seconds for the start (UTC) of the current calendar month. */
export function monthStartUnix(): number {
  return Math.floor(new Date(monthStartISO()).getTime() / 1000);
}
