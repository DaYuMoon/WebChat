const express = require('express')
const router = express.Router()

router.post('/log/sendFiles', (req, res) => {
  const { fromId, toId, filename, size } = req.body
  console.log(`${fromId} 向 ${toId} 发送 [[${filename}]], (大小: ${size})`)

  res.sendStatus(206)
})

exports.router = router
