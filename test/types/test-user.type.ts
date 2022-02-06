export type TestUserType = {
    dto: {
        _id: string;
        email: string;
        first_name?: string;
        second_name?: string;
        birthday?: string;
        avatar_url?: string;
        address?: TestUserAddress;
    };
    accessToken: string;
};

export type TestUserAddress = {
    index: string;
    city: string;
    street: string;
    apartment: string;
};
