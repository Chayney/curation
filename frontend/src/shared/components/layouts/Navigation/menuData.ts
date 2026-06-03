import {
    Star,
    Newspaper,
    Bookmark,
    Rss,
    Heart
} from "lucide-react";
import { NAVIGATION_PATH } from "../../../const/navigation";

export const mainItems = [
    { title: "Feeds", url: NAVIGATION_PATH.FEED, icon: Rss },
    { title: "Trend", url: NAVIGATION_PATH.TREND, icon: Star },
    { title: "Bookmarks", url: NAVIGATION_PATH.BOOKMARK, icon: Bookmark }
];

export const feedItems = [
    {
        title: "All",
        icon: Newspaper
    },
    {
        title: "Next.js",
        category_id: 1,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "React",
        category_id: 2,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "TypeScript",
        category_id: 3,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "GCP",
        category_id: 4,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "AWS",
        category_id: 5,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    }
];

export const favoriteItems = [
    { title: "Next.js", url: NAVIGATION_PATH.FAVORITE, category_id: 1, icon: Heart },
    { title: "React", url: NAVIGATION_PATH.FAVORITE, category_id: 2, icon: Heart },
    { title: "TypeScript", url: NAVIGATION_PATH.FAVORITE, category_id: 3, icon: Heart },
    { title: "GCP", url: NAVIGATION_PATH.FAVORITE, category_id: 4, icon: Heart },
    { title: "AWS", url: NAVIGATION_PATH.FAVORITE, category_id: 5, icon: Heart },
];