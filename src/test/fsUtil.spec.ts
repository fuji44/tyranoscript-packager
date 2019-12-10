import * as fsUtil from "../fsUtil";

// ----- isNotExist -------------------- //
test('isNotExist : Exist file', () => {
  expect(fsUtil.isNotExist(__filename)).toBeFalsy();
});

test('isNotExist : Not Exist file', () => {
  expect(fsUtil.isNotExist('notExistFilePath')).toBeTruthy();
});

// ----- canNotRead -------------------- //
test('canNotRead : Unreadable file', () => {
  let unreadableFile;
  switch (process.platform) {
    case 'aix':
    case 'android':
    case 'freebsd':
    case 'linux':
    case 'netbsd':
    case 'openbsd':
    case 'sunos':
      unreadableFile = '/root';
      break;
    case 'darwin':
      unreadableFile = '/System';
    case 'win32':
    default:
      // windows or unknown os is skip
      return;
  }
  expect(fsUtil.canNotRead(unreadableFile)).toBeTruthy();
});

test('canNotRead : Readable file', () => {
  expect(fsUtil.canNotRead(__filename)).toBeFalsy();
});

test('canNotRead : Not Exist file', () => {
  expect(fsUtil.canNotRead('notExistFilePath')).toBeTruthy();
});
