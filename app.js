if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


// Se define el directorio en donde se encuentra el front para subir la imagen.
// Puede ser una carpeta 'public' o el archivo index.html puede estar en la raiz.
app.use(express.static(path.join(__dirname, '.')))

const multer = require('multer')
const inMemoryStorage = multer.memoryStorage()
const uploadStrategy = multer({ storage: inMemoryStorage }).single('image')

//const config = require('./config')

const azureStorage = require('azure-storage')
const blobService = azureStorage.createBlobService()
const containerName = 'files-demo'

const getStream = require('into-stream')
//const { getStorageAccountName } = require('./config')

const getBlobName = originalName => {
    const identifier = Math.random().toString().replace(/0\./, '')
    return `${identifier}-${originalName}`
}

app.post('/upload', uploadStrategy, (req, res) => {
    const blobName = getBlobName(req.file.originalname)
    const stream = getStream(req.file.buffer)
    const streamLength = req.file.buffer.length

    blobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, err => {
        if(err) {
        console.log(err)
        return
        }
        res.status(200).send('Archivo subido exitosamente...')
    })
})
app.get('/all', (req, res) => {
    blobService.listBlobsSegmented(containerName, null, (err, data) => {
        if(err) {
            console.log(err)
            return
        } else{
            let images = ''
            if(data.entries.length) {
                data.entries.forEach(element => {
                    
                    images += `<img src="https://stgehspocdev001.blob.core.windows.net/files-demo/${element.name}" width="400" />`
                })

                    res.send(images)

            }
        }
    })
})

app.get('/image/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const stream = blobService.createReadStream(containerName, imageName);
    stream.pipe(res);
})

app.listen(3000, () => {
    console.log('server started')
})

module.exports = app