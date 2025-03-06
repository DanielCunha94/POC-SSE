export default class HttpClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(
		url: string,
		options: RequestInit
	): Promise<{ hasError: boolean; data: T | null; error: string | null }> {
		try {
			const response = await fetch(`${this.baseUrl}${url}`, options);
			if (!response.ok) {
				const errorText = await response.text();
				return { hasError: true, data: null, error: errorText };
			}
			const data = await response.json();
			return { hasError: false, data: data as T, error: null };
		} catch (e) {
			console.log(e);
			return { hasError: true, data: null, error: 'Request failed' };
		}
	}

	public async get<T>(
		url: string,
		headers: Record<string, string> = {}
	): Promise<{ hasError: boolean; data: T | null; error: string | null }> {
		return this.request<T>(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...headers
			}
		});
	}

	public async post<K, T>(
		url: string,
		body: K,
		headers: Record<string, string> = {}
	): Promise<{ hasError: boolean; data: T | null; error: string | null }> {
		return this.request<T>(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify(body)
		});
	}

	public async put<K, T>(
		url: string,
		body: K,
		headers: Record<string, string> = {}
	): Promise<{ hasError: boolean; data: T | null; error: string | null }> {
		return this.request<T>(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify(body)
		});
	}

	public async delete<K, T>(
		url: string,
		body: K,
		headers: Record<string, string> = {}
	): Promise<{ hasError: boolean; data: T | null; error: string | null }> {
		return this.request<T>(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify(body)
		});
	}

	public async patch<K, T>(
		url: string,
		body: K,
		headers: Record<string, string> = {}
	): Promise<{ hasError: boolean; data: T | null; error: string | null }> {
		return this.request<T>(url, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify(body)
		});
	}
}

export const api = new HttpClient('http://localhost:8080');
