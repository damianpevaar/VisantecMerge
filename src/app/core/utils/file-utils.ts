export function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            resolve(commaIndex >= 0 ? result.substring(commaIndex + 1) : result);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

export function downloadFromBase64(fileName: string, base64: string, contentType: string): void {
    const link = document.createElement('a');
    const blob = base64ToBlob(base64, contentType);
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
}
