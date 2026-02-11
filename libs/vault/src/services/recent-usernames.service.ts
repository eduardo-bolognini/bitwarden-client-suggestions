import { Injectable } from "@angular/core";
import { map, Observable, of, catchError, firstValueFrom, switchMap } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";

import { RECENT_USERNAMES_KEY } from "./recent-usernames.state";

/**
 * Service to manage recent usernames for autocomplete in login forms.
 * Stores up to 20 recent usernames encrypted on disk using AES-256-CBC.
 * Data is automatically encrypted/decrypted by StateProvider.
 * Persists across sessions and loads automatically at login.
 */
@Injectable({
  providedIn: "root",
})
export class RecentUsernamesService {
  private readonly MAX_USERNAMES = 20;

  constructor(
    private accountService: AccountService,
    private stateProvider: StateProvider,
  ) {}

  /**
   * Get recent usernames for active user as an Observable
   * @returns Observable of recent usernames (empty array if not available)
   */
  recentUsernames$(): Observable<string[]> {
    return this.accountService.activeAccount$.pipe(
      switchMap((account) => {
        if (!account?.id) {
          return of([]);
        }
        return this.stateProvider.getUser(account.id, RECENT_USERNAMES_KEY).state$;
      }),
      map((usernames) => usernames ?? []),
      catchError(() => {
        return of([]);
      }),
    );
  }

  /**
   * Get the top N most recent usernames for a user
   * @param userId The user ID
   * @param limit Maximum number of usernames to return (default: 3)
   */
  async getRecent(userId: UserId, limit: number = 3): Promise<string[]> {
    try {
      const state = this.stateProvider.getUser(userId, RECENT_USERNAMES_KEY);
      const usernames = await firstValueFrom(state.state$);
      return (usernames ?? []).slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Add a username to the history (LRU: most recent first)
   * Automatically encrypts and saves to disk
   * @param userId The user ID
   * @param username The username to add
   */
  async addUsername(userId: UserId, username: string): Promise<void> {
    if (!username || username.trim() === "") {
      return;
    }

    try {
      const trimmed = username.trim();
      const state = this.stateProvider.getUser(userId, RECENT_USERNAMES_KEY);

      await state.update((current) => {
        const currentUsernames = current ?? [];

        // Remove if already exists (to move it to the top)
        const filtered = currentUsernames.filter((u) => u !== trimmed);

        // Add to top and keep max MAX_USERNAMES
        return [trimmed, ...filtered].slice(0, this.MAX_USERNAMES);
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear all history for a user
   * @param userId The user ID
   */
  async clear(userId: UserId): Promise<void> {
    try {
      const state = this.stateProvider.getUser(userId, RECENT_USERNAMES_KEY);
      await state.update(() => []);
    } catch {
      // Silently fail
    }
  }
}
