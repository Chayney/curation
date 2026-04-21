export type AllList = {
    id: number;
    url: string;
    title: string;

    created_at: string;
    updated_at: string;

    tags: {
        name: string;
    }[];

    user: {
        id: string;
        name: string | null;
        profile_image_url: string;
    };
}