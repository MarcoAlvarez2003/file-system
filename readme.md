# File System

## Interfaces

### Directory

[Directory](#directory) extends from [Status](#status)

```typescript
export interface Directory<FileType extends Status = Status> extends Status {
    content: (Directory | FileType)[];
}
```

### Archive

[Archive](#archive) extends from [Status](#status)

```typescript
export interface Archive extends Status {
    extension: string;
    body: string;
}
```

### Status

```typescript
export interface Status {
    readonly name: string;
    readonly size: number;
    readonly path: string;
}
```

## Functions

### Tools

#### exist

```typescript
export const exist = async (path: string) => {
    try {
        await Deno.stat(path);
        return !!1;
    } catch {
        return !!0;
    }
};
```

#### isDirectory

```typescript
export const isDirectory = (obj: unknown): obj is Directory => !!(obj as Directory)?.content;
```

#### isArchive

```typescript
export const isArchive = (obj: unknown): obj is Archive =>
    isStat(obj) && !!(obj as Archive)?.body && !!(obj as Archive)?.extension;
```

#### isStat

```typescript
export const isStat = (obj: unknown): obj is Status =>
    !!(obj as Status)?.name && !!(obj as Status)?.path && !!(obj as Status)?.size;
```

### Fs

#### getFilesOfDirectory

```typescript
export async function getFilesOfDirectory(link: string) {
    return await Promise.all(
        (await getStatsOfDirectory(link)).map(async (item) => await getArchive(item.path))
    );
}
```

#### getStatsOfDirectory

```typescript
export async function getStatsOfDirectory(link: string) {
    return (await getDirectoryStats(link)).content.filter((item) => !isArchive(item)) as Status[];
}
```

#### getDirectoryDirs

```typescript
export async function getDirectoryDirs(link: string) {
    return (await getDirectoryStats(link)).content.filter((item) =>
        isDirectory(item)
    ) as Directory[];
}
```

#### getDirectoryFiles

```typescript
export async function getDirectoryFiles(link: string) {
    return await parseDirectory(await getDirectoryStats(link));
}
```

#### getDirectoryStats

```typescript
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
```

#### parseDirectory

```typescript
export async function parseDirectory(directory: Directory<Status>) {
    for (let i = 0; i < directory.content.length; i++) {
        const stat = directory.content[i];

        directory.content[i] = isDirectory(stat)
            ? await parseDirectory(stat)
            : await getArchive(stat.path);
    }

    return directory as Directory<Archive>;
}
```

#### getArchive

```typescript
export async function getArchive(link: string): Promise<Archive> {
    return {
        extension: path.extname(link),
        ...(await getStatus(link)),
        body: await getBody(link),
    };
}
```

#### getStatus

```typescript
export async function getStatus(link: string): Promise<Status> {
    return {
        name: path.basename(link),
        path: link,
        size: await getSize(link),
    };
}
```

#### getSize

```typescript
export async function getSize(link: string) {
    return (await exist(link)) ? (await Deno.stat(link)).size : 0;
}
```

#### getBody

```typescript
export async function getBody(link: string) {
    return (await exist(link)) ? await Deno.readTextFile(link) : "";
}
```
