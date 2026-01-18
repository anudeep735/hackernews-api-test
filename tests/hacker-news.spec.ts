import { test, expect } from '@playwright/test';
import { HackerNewsType } from '../utils/constants';
import { Asserts } from '../helpers/asserts';

/**
 * HackerNews API Acceptance Tests
 */
test.describe('HackerNews API Acceptance Tests', () => {

  test('[hacker-news-01], Retrieving top stories should return a list of IDs', async ({ request }) => {
    const response = await request.get(`${process.env.BASE_URL}/topstories.json`);
    expect(response.ok()).toBeTruthy();

    const stories = await response.json();
    const actionsObj = new Asserts(request);
    await actionsObj.assertTopStories(stories);
  });

  test('[hacker-news-02], Retrieving top stories with unexpected query parameters handled gracefully', async ({ request }) => {
    // Edge Case: HN API returns handles unexpected query parameters gracefully
    const response = await request.get(`${process.env.BASE_URL}/topstories.json?pick=invalid`);
    expect(response.ok()).toBeTruthy();

    const stories = await response.json();
    const actionsObj = new Asserts(request);
    await actionsObj.assertTopStories(stories);
  });

  test('[hacker-news-03], Using Top Stories API to retrieve the current top story', async ({ request }) => {
    const storiesResponse = await request.get(`${process.env.BASE_URL}/topstories.json`);
    const stories = await storiesResponse.json();

    expect(stories.length, 'Story IDs should be more than 0').toBeGreaterThan(0);

    const topStoryId = stories[0];

    const itemResponse = await request.get(`${process.env.BASE_URL}/item/${topStoryId}.json`);
    expect(itemResponse.ok()).toBeTruthy();

    const item = await itemResponse.json();
    expect(item).toHaveProperty('by');
    expect(item.id).toBe(topStoryId);
    expect(item.type).toMatch(new RegExp(`${HackerNewsType.STORY}|${HackerNewsType.JOB}`));
    expect(item).toHaveProperty('title');
  });

  test('[hacker-news-04], Handle gracefully for non-existent item IDs', async ({ request }) => {
    // Edge Case: HN API returns "null" with a 200 OK for IDs that don't exist
    const response = await request.get(`${process.env.BASE_URL}/item/anudeep.json`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toBeNull();
  });

  test('[hacker-news-05], Handle gracefully for item IDs with invalid ID format', async ({ request }) => {
    // Edge Case: HN API returns "null" with a 200 OK for IDs with invalid format
    const response = await request.get(`${process.env.BASE_URL}/item/anudeep.json`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toBeNull();
  });

  test('[hacker-news-06], Handle gracefully for valid IDs with invalid format', async ({ request }) => {
    const storiesResponse = await request.get(`${process.env.BASE_URL}/topstories.json`);
    const stories = await storiesResponse.json();

    expect(stories.length, 'Story IDs should be more than 0').toBeGreaterThan(0);

    const topStoryId = stories[0];

    // Edge Case: HN API returns "null" with a 200 OK for valid IDs with invalid format
    const response = await request.get(`${process.env.BASE_URL}/item/${topStoryId}`);
    expect(response.ok()).toBeTruthy(); // Missing .json to simulate invalid format returns Ok status
    // const data = await response.json(); // This would throw an error
  });

  test('[hacker-news-07], Retrieve a top story and its first comment', async ({ request }) => {
    const assertsObj = new Asserts(request);
    const storiesResponse = await request.get(`${process.env.BASE_URL}/topstories.json`);
    const stories = await storiesResponse.json();
    const firstStoryId = stories[0];

    const itemResponse = await request.get(`${process.env.BASE_URL}/item/${firstStoryId}.json`);
    const item = await itemResponse.json();

    // Edge Case: The very top story might not have comments yet
    if (item.kids && item.kids.length > 0) {
      const firstCommentId = item.kids[0];
      const commentResponse = await request.get(`${process.env.BASE_URL}/item/${firstCommentId}.json`);
      expect(commentResponse.ok()).toBeTruthy();
      const comment = await commentResponse.json();

      await assertsObj.assertComment(comment, firstCommentId, firstStoryId);
    }
    else {
      console.warn('The top story has no comments at this time.');
    }
  });

  test('[hacker-news-08], Retrieve a top story that has a comment', async ({ request }) => {
    const assertsObj = new Asserts(request);
    const storiesResponse = await request.get(`${process.env.BASE_URL}/topstories.json`);
    const stories = await storiesResponse.json();

    let foundComment = false;

    // Edge Case: The very top story might not have comments yet
    // Iterate until a story with the "kids" property is found
    for (let i = 0; i < Math.min(stories.length, 20); i++) {
      const itemResponse = await request.get(`${process.env.BASE_URL}/item/${stories[i]}.json`);
      const item = await itemResponse.json();

      if (item.kids && item.kids.length > 0) {
        const firstCommentId = item.kids[0];
        const commentResponse = await request.get(`${process.env.BASE_URL}/item/${firstCommentId}.json`);
        const comment = await commentResponse.json();

        await assertsObj.assertComment(comment, firstCommentId, item.id);
        foundComment = true;
        break;
      }
    }

    if (!foundComment) {
      console.warn('No stories in the top 20 had comments at this time.');
    }
  });
});
