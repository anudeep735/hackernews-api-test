import { APIRequestContext } from "playwright/test";
import { HackerNewsType } from "../utils/constants";


export async function getTopStories(request: APIRequestContext, prettyFormat: boolean = false) {
    let prettyString = '';
    if (prettyFormat) {
        prettyString = '?print=pretty';
    }
    const response = await request.get(`${process.env.BASE_URL}/topstories.json${prettyString}`);
    return response;
}


