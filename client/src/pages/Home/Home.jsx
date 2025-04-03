import React, { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import "./Home.css";

const Home = () => {
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  const videoRef = useRef(null);
  const parsedSubtitles = useRef([]);

  // Function to parse SRT format
  const parseSRT = (srtContent) => {
    if (!srtContent) return [];

    try {
      const subtitles = [];
      const subtitleBlocks = srtContent.trim().split(/\n\s*\n/);

      subtitleBlocks.forEach((block) => {
        const lines = block.trim().split("\n");
        if (lines.length >= 3) {
          // Parse the time codes (second line)
          const timeCode = lines[1];
          const [start, end] = timeCode.split(" --> ");

          // Check if the time format is valid
          if (!start || !end) return;

          // Convert SRT time format (00:00:00,000) to seconds
          const convertTimeToSeconds = (timeString) => {
            try {
              const [hours, minutes, secondsAndMs] = timeString.split(":");
              const [seconds, milliseconds] = secondsAndMs.split(",");
              return (
                parseInt(hours) * 3600 +
                parseInt(minutes) * 60 +
                parseInt(seconds) +
                parseInt(milliseconds) / 1000
              );
            } catch (error) {
              console.error("Invalid time format:", timeString);
              return 0;
            }
          };

          const startTime = convertTimeToSeconds(start);
          const endTime = convertTimeToSeconds(end);

          // Get the subtitle text (third line and onwards)
          const text = lines.slice(2).join(" ");

          subtitles.push({
            id: lines[0],
            startTime,
            endTime,
            text,
          });
        }
      });

      return subtitles;
    } catch (error) {
      console.error("Error parsing subtitles:", error);
      return [];
    }
  };

  // Parse subtitles when they are loaded
  useEffect(() => {
    if (subtitle) {
      parsedSubtitles.current = parseSRT(subtitle);
    }
  }, [subtitle]);

  // Handle timeupdate event to show correct subtitles
  const handleTimeUpdate = () => {
    if (!videoRef.current || parsedSubtitles.current.length === 0) return;

    const currentTime = videoRef.current.currentTime;

    // Find the subtitle that should be displayed at the current time
    const activeSubtitle = parsedSubtitles.current.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );

    setCurrentSubtitle(activeSubtitle ? activeSubtitle.text : "");
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      setError("");

      // Create object URL for video preview
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  }, []);

  // Fix for the file acceptance in useDropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [],
      "application/octet-stream": [".mkv"], // Correct way to handle MKV files
    },
    maxFiles: 1,
    onDropRejected: () => {
      setError("Please upload a valid video file");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName) return;

    setLoading(true);
    setSubtitle("");
    setError("");

    try {
      const formData = new FormData();
      const fileInput = document.querySelector('input[name="video"]');
      if (fileInput.files.length > 0) {
        formData.append("video", fileInput.files[0]);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/subs/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Clean up the subtitle data by removing the markdown code block
      let subtitleData = response.data.subs;
      if (subtitleData.startsWith("```srt\n")) {
        subtitleData = subtitleData
          .replace("```srt\n", "")
          .replace("\n```", "");
      }

      setSubtitle(subtitleData);
      setActiveTab("play");
    } catch (error) {
      console.error(error);
      setError("Failed to generate subtitles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([subtitle], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "subtitle.srt";
    link.click();
    link.remove();
  };

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="subtitle-container">
      <div className="subtitle-card">
        <div className="card-header">
          <h1 className="card-title">Video Subtitle Generator</h1>
          <p className="card-subtitle">
            Upload a video file to automatically generate subtitles
          </p>
        </div>

        <div className="card-body">
          {subtitle && (
            <div className="tabs">
              <div
                className={`tab ${activeTab === "upload" ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                Upload
              </div>
              <div
                className={`tab ${activeTab === "play" ? "active" : ""}`}
                onClick={() => setActiveTab("play")}
              >
                Play with Subtitles
              </div>
            </div>
          )}

          {activeTab === "upload" ? (
            <form onSubmit={handleSubmit}>
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? "active" : ""}`}
              >
                <input {...getInputProps({ name: "video", required: true })} />

                <div>
                  <svg
                    className="upload-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      className="upload-icon-inner"
                    ></path>
                    <polyline
                      points="17 8 12 3 7 8"
                      className="upload-icon-inner"
                    ></polyline>
                    <line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="15"
                      className="upload-icon-inner"
                    ></line>
                  </svg>
                  <p className="dropzone-text">
                    {isDragActive
                      ? "Drop the video file here"
                      : "Drag & drop a video file here, or click to select"}
                  </p>
                  <p className="dropzone-hint">
                    Supports: MP4, AVI, MKV, MOV and other video formats
                  </p>
                  {fileName && (
                    <div className="file-selected">
                      <svg
                        className="file-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span className="file-name">{fileName}</span>
                    </div>
                  )}
                  {error && (
                    <div
                      style={{
                        color: "var(--error)",
                        marginTop: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="button-container">
                <button
                  type="submit"
                  disabled={loading || !fileName}
                  className="submit-button"
                >
                  {loading ? (
                    <span className="button-content">
                      <svg
                        className="spinner"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      Processing Video...
                    </span>
                  ) : (
                    "Generate Subtitles"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="video-container">
              <div className="video-player">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                />
                {currentSubtitle && (
                  <div className="subtitle-display">{currentSubtitle}</div>
                )}
                <button
                  onClick={playVideo}
                  className="action-button play-button"
                  style={{ marginTop: "10px", width: "100%" }}
                >
                  <svg
                    className="download-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Play
                </button>
              </div>

              <div className="subtitle-result">
                <div className="result-header">
                  <h2 className="result-title">Generated Subtitles</h2>
                  <div className="subtitle-actions">
                    <button
                      onClick={handleDownload}
                      className="download-button"
                    >
                      <svg
                        className="download-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
                <pre className="subtitle-text">{subtitle}</pre>
              </div>
            </div>
          )}

          {activeTab === "upload" && subtitle && (
            <div className="subtitle-result">
              <div className="result-header">
                <h2 className="result-title">Generated Subtitles</h2>
                <div className="subtitle-actions">
                  <button onClick={handleDownload} className="download-button">
                    <svg
                      className="download-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
                  </button>
                </div>
              </div>
              <pre className="subtitle-text">{subtitle}</pre>
              <button
                onClick={() => setActiveTab("play")}
                className="action-button play-button"
                style={{ marginTop: "10px", width: "100%" }}
              >
                <svg
                  className="download-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Play Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
