export type PlatformRole = 'SUPER_ADMIN' | 'SUPPORT';
export interface PlatformUser {
    id: string; email: string; name: string; role: PlatformRole;
    isActive: boolean; lastLoginAt: string | null; createdAt: string;
}
export interface Paged<T> { items: T[]; page: number; limit: number; total: number }