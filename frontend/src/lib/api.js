export const API_BASE = "https://api.pardhangroup.com";

// export const API_BASE = "http://192.168.1.56:6969";

export function getToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("crm_auth_token") ?? "";
}

export function authHeaders(isFormData = false) {
    const token = getToken();
    return {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export async function apiFetch(path, options = {}) {
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...authHeaders(isFormData),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        localStorage.removeItem("crm_auth_token");
        localStorage.removeItem("crm_user");
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        let message = json.message || `Error ${res.status}: ${res.statusText}`;

        if (Array.isArray(json.errors) && json.errors.length > 0) {
            message = json.errors
                .map(e => (e.field ? `${e.field}: ${e.message}` : e.message))
                .filter(Boolean)
                .join(" · ");
        }

        const err = new Error(message);
        err.status = res.status;
        err.errors = json.errors;
        throw err;
    }

    return json;
}
