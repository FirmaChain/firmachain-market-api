import * as fs from 'fs';

const PUBLIC_DIR_PATH = './public';

export const WriteFile = async (fileName: string, contents: string) => {
  // public dir check
  await existPublicDir();

  const fullPath = `${PUBLIC_DIR_PATH}/${fileName}`;

  return await fs.promises.writeFile(fullPath, contents);
};

export const ReadFile = async (fileName: string) => {
  // public dir check
  await existPublicDir();

  const fullPath = `${PUBLIC_DIR_PATH}/${fileName}`;
  
  return await fs.promises.readFile(fullPath, { encoding: 'utf-8' });
};


export const ExistsFile = async (fileName: string) => {
  // public dir check
  await existPublicDir();

  const fullPath = `${PUBLIC_DIR_PATH}/${fileName}`;

  return fs.existsSync(fullPath);
};

async function existPublicDir() {
  if (!fs.existsSync(PUBLIC_DIR_PATH)) {
    fs.promises.mkdir(PUBLIC_DIR_PATH);
  }
}