import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "invoicing_token";

export function storeToken(token, remember = false) {
  if (remember) Cookies.set(TOKEN_KEY, token, { expires: 30 });
  else Cookies.set(TOKEN_KEY, token);
}

export function getToken() {
  return Cookies.get(TOKEN_KEY);
}

export function logout() {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
