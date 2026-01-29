import { test, expect } from '@playwright/test';
import { HackerNewsType } from '../utils/constants';
import { Asserts } from '../helpers/asserts';
import { getTopStories } from '../helpers/apis';

/**
 * HackerNews API Acceptance Tests
 */
test.describe('HackerNews API Acceptance Tests', () => {

  test('[hacker-news-01], Retrieving top stories should return a list of IDs', async ({ request }) => {
    const response = await getTopStories(request, true);
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
    const storiesResponse = await getTopStories(request, true);
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
   const storiesResponse = await getTopStories(request, true);
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
    const storiesResponse = await getTopStories(request, true);
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
    const storiesResponse = await getTopStories(request, true);
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

  test('[hacker-news-online], Test with/without pretty', async ({ request }) => {
    const noPrettyresponse = await getTopStories(request);
    expect(noPrettyresponse.ok()).toBeTruthy();

    const npResponseBody = await noPrettyresponse.json();

    const prettyresponse = await getTopStories(request, true);
    expect(prettyresponse.ok()).toBeTruthy();

    const pResponseBody = await prettyresponse.json();

    // Check that the response body contains newlines and indentation typical of pretty-printed JSON
    expect(npResponseBody).toEqual(pResponseBody);
  });

  test('[hacker-news-online-01], Deletec', async ({ request }) => {
    const response = await getTopStories(request);
    expect(response.ok()).toBeTruthy();

    let fountItem = null;
    const stories = await response.json();
    for (const storyId of stories) {
      const itemResponse = await request.get(`${process.env.BASE_URL}/item/${storyId}.json`);
      expect(itemResponse.ok()).toBeTruthy();
      
      const item = await itemResponse.json();
      if (item.deleted && item.deleted === true) {
        fountItem = item;
        console.log(`Found deleted item with ID: ${item.id}`);
        break;
      }
      else {
        console.log(`Item ID: ${item.id} is not deleted.`);
      }
    }
  });

  test.only('[hacker-news-online-01], Deleted', async ({ request }) => {
    let storyId = 43920636;
    let startTime = Date.now();
    const itemResponse = await request.get(`${process.env.BASE_URL}/item/${storyId}.json`);
    let endTime = Date.now();
    let timeTaken = endTime - startTime;
    console.log(`Time taken to fetch item ID ${storyId}: ${timeTaken} ms`);

    if (timeTaken < 2000) {
      console.log(`Fetching item ID ${storyId} took Less than 2 seconds.`);
    }
    expect(itemResponse.ok()).toBeTruthy();
    
    const item = await itemResponse.json();
    if (item.deleted && item.deleted === true) {
      console.log(`Found deleted item with ID: ${item.id}`);
    }
    else {
      console.log(`Item ID: ${item.id} is not deleted.`);
    }
  });

  // 43920636
});
