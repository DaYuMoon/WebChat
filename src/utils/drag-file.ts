/*
 * @Description:
 * @Date: 2023-02-07 11:58:23
 * @LastEditTime: 2023-02-14 10:06:03
 */

/**
 * 处理拖拽事件 - 处理文件
 */
export function dropHandler(evt: DragEvent): null | File {
  // console.log(evt)

  // 阻止浏览器默认行为
  evt.preventDefault()

  // console.log(evt.dataTransfer?.files)
  // console.log(evt.dataTransfer?.items)

  let fileSource: Nullable<File> = null
  let isDir = false
  // 判断是否为文件夹
  if (evt.dataTransfer?.items) {
    for (const item of evt.dataTransfer.items) {
      if (!item.webkitGetAsEntry())
        continue

      const { isDirectory } = item.webkitGetAsEntry() as FileSystemEntry

      // NOTE: 当前版本不支持文件夹上传
      if (isDirectory) {
        const errorWords = '当前版本不支持 <上传文件夹> '
        console.warn(errorWords)
        // window.alert(errorWords)
        isDir = true
        throw new Error(errorWords)
        // break
      }

      // console.log('是否为文件', isDirectory)
      // console.log(item.webkitGetAsEntry())
    }
  }
  if (isDir === false) {
    const files = evt.dataTransfer?.files

    if (files) {
      [...files].forEach((file) => {
        // 这里是 file 对象, 可以使用 FileReader 来读取
        // console.log(file)
        fileSource = file as File
      })
    }
  }
  return fileSource
}

