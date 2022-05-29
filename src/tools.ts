export interface Directory<FileType extends Status = Status> extends Status {
    content: (Directory | FileType)[];
}

export interface Archive extends Status {
    extension: string;
    body: string;
}

export interface Status {
    readonly name: string;
    readonly size: number;
    readonly path: string;
}

export const exist = async (path: string) => {
    try {
        await Deno.stat(path);
        return !!1;
    } catch {
        return !!0;
    }
};

export const isDirectory = (obj: unknown): obj is Directory => !!(obj as Directory)?.content;

export const isArchive = (obj: unknown): obj is Archive =>
    isStat(obj) && !!(obj as Archive)?.body && !!(obj as Archive)?.extension;

export const isStat = (obj: unknown): obj is Status =>
    !!(obj as Status)?.name && !!(obj as Status)?.path && !!(obj as Status)?.size;
