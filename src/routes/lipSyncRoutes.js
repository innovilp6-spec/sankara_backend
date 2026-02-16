const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();



router.get("test", async (req, res) => {
    console.log("Received test request");
    res.json({ message: "Lip sync route is working!" });
})

const VIDEO_DIR = path.join(process.cwd(), "public", "videos");

/**
 * GET /api/video/get-video?filename=test.mp4
 */
router.post("/", (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                error: "filename body parameter is required"
            });
        }

        const safeFilename = path.basename(filename); // 🔒 prevent path traversal
        const videoPath = path.join(VIDEO_DIR, safeFilename);
        console.log("Looking for video at:", videoPath);    
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                error: "Video not found"
            });
        }

        // Since Express static is serving /public
        const videoUrl = `${req.protocol}://${req.get("host")}/public/videos/${safeFilename}`;

        return res.json({
            success: true,
            videoUrl
        });

    } catch (error) {
        console.error("Get video error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error"
        });
    }
});



// POST /api/video/get-video
// router.post("/get-video", (req, res) => {
//     try {
//         const { filename } = req.body;

//         if (!filename) {
//             return res.status(400).json({ error: "filename is required" });
//         }

//         const videoPath = path.join(VIDEO_DIR, filename);

//         if (!fs.existsSync(videoPath)) {
//             return res.status(404).json({ error: "Video not found" });
//         }

//         const stat = fs.statSync(videoPath);
//         const fileSize = stat.size;
//         const range = req.headers.range;

//         // 🔥 Support video streaming (important for <video>)
//         if (range) {
//             const parts = range.replace(/bytes=/, "").split("-");
//             const start = parseInt(parts[0], 10);
//             const end = parts[1]
//                 ? parseInt(parts[1], 10)
//                 : fileSize - 1;

//             const chunkSize = (end - start) + 1;
//             const file = fs.createReadStream(videoPath, { start, end });

//             res.writeHead(206, {
//                 "Content-Range": `bytes ${start}-${end}/${fileSize}`,
//                 "Accept-Ranges": "bytes",
//                 "Content-Length": chunkSize,
//                 "Content-Type": "video/mp4",
//             });

//             file.pipe(res);
//         } else {
//             res.writeHead(200, {
//                 "Content-Length": fileSize,
//                 "Content-Type": "video/mp4",
//             });

//             fs.createReadStream(videoPath).pipe(res);
//         }

//     } catch (error) {
//         console.error("Video streaming error:", error);
//         res.status(500).json({ error: "Server error" });
//     }
// });

module.exports = router;

