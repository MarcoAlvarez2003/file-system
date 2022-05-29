import { Directory, Archive, Status, exist, isDirectory, isArchive } from "./tools.ts";
import { path } from "./deps.ts";

export async function getFilesOfDirectory(link: string) {
    return await Promise.all(
        (await getStatsOfDirectory(link)).map(async (item) => await getArchive(item.path))
    );
}

export async function getStatsOfDirectory(link: string) {
    return (await getDirectoryStats(link)).content.filter((item) => !isArchive(item)) as Status[];
}

export async function getDirectoryDirs(link: string) {
    return (await getDirectoryStats(link)).content.filter((item) =>
        isDirectory(item)
    ) as Directory[];
}

export async function getDirectoryFiles(link: string) {
    return await parseDirectory(await getDirectoryStats(link));
}

export async function getDirectoryStats(link: string) {
    const directory: Directory = {
        ...(await getStatus(link)),
        content: [],
    };

    for await (const entry of Deno.readDir(link)) {
        const filepath = path.join(link, entry.name);

        directory.content.push(
            entry.isFile ? await getStatus(filepath) : await getDirectoryStats(filepath)
        );
    }

    return directory;
}

export async function parseDirectory(directory: Directory<Status>) {
    for (let i = 0; i < directory.content.length; i++) {
        const stat = directory.content[i];

        directory.content[i] = isDirectory(stat)
            ? await parseDirectory(stat)
            : await getArchive(stat.path);
    }

    return directory as Directory<Archive>;
}

export async function getArchive(link: string): Promise<Archive> {
    return {
        extension: path.extname(link),
        ...(await getStatus(link)),
        body: await getBody(link),
    };
}

export async function getStatus(link: string): Promise<Status> {
    return {
        name: path.basename(link),
        path: link,
        size: await getSize(link),
    };
}

export async function getSize(link: string) {
    return (await exist(link)) ? (await Deno.stat(link)).size : 0;
}

export async function getBody(link: string) {
    return (await exist(link)) ? await Deno.readTextFile(link) : "";
}
