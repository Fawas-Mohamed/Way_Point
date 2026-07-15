type UnauthorizedListener = () => void;

let accessToken: string | null = null;
let unauthorizedListener: UnauthorizedListener | null = null;

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
  },
  onUnauthorized(listener: UnauthorizedListener): void {
    unauthorizedListener = listener;
  },
  notifyUnauthorized(): void {
    unauthorizedListener?.();
  },
};
