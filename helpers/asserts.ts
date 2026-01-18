import { APIRequestContext, expect } from "playwright/test";
import { HackerNewsType } from "../utils/constants";

export class Asserts {
    request: APIRequestContext;
    
    constructor(request: APIRequestContext) {
        this.request = request;
    }

    /**
     * Assert that the provided stories array meets the expected criteria.
     * @param stories - Array of story IDs
     */
    async assertTopStories(stories: any) {
        expect(Array.isArray(stories)).toBeTruthy();
        expect(stories.length, 'Story IDs should be max of 500').toBeLessThanOrEqual(500);
        expect(stories.length, 'Story IDs should be more than 0').toBeGreaterThan(0);
        expect(typeof stories[0]).toBe('number');
    
        const uniqueIds = new Set(stories);
        expect(uniqueIds.size, 'Story IDs should be unique').toBe(stories.length);
    }

    /**
     * Assert that the provided comment meets the expected criteria.
     * @param comment - Comment object
     * @param commentId - Expected comment ID
     * @param parentId - Expected parent item ID
     */
    async assertComment(comment: Record<string,any>, commentId: number, parentId: number) {
        expect(comment.id).toBe(commentId);
        expect(comment.type).toBe(HackerNewsType.COMMENT);
        expect(comment.parent).toBe(parentId);
        if (!comment.deleted || comment.deleted === false) {
            expect(comment).toHaveProperty('by');
            expect(comment).toHaveProperty('text');
        }
    }
}