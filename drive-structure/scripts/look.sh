#!/usr/bin/env bash
# Lets Claude "watch" one video: a contact sheet of 12 frames from across it, plus a
# transcript if Whisper or WhisperX is installed.
#
#   scripts/look.sh "<video>" "<notes folder>"
#
# Saves <notes folder>/<video name>.jpg and <notes folder>/<video name>.txt.
set -euo pipefail

video="${1:?Give the video path first}"
out="${2:?Give the notes folder second}"
mkdir -p "$out"

name="$(basename "$video")"
name="${name%.*}"
sheet="$out/$name.jpg"
text="$out/$name.txt"

if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  echo "ffmpeg isn't installed. On a Mac: brew install ffmpeg" >&2
  exit 1
fi

duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$video")"
if [ -z "$duration" ] || [ "$duration" = "N/A" ]; then
  echo "Couldn't read the length of $video. It may still be downloading." >&2
  exit 1
fi

# 12 frames spread evenly across the video, tiled 4 across and 3 down.
fps="$(awk -v d="$duration" 'BEGIN { printf "%.6f", 12 / (d > 0.1 ? d : 0.1) }')"
ffmpeg -v error -y -i "$video" \
  -vf "fps=$fps,scale=320:-2,tile=4x3" -frames:v 1 -q:v 4 "$sheet"

audio="$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$video" | head -1)"

if [ -z "$audio" ]; then
  echo "(no sound)" > "$text"
elif command -v whisper >/dev/null; then
  tmp="$(mktemp -d)"
  whisper "$video" --model base --output_format txt --output_dir "$tmp" >/dev/null 2>&1
  mv "$tmp"/*.txt "$text"
  rm -rf "$tmp"
elif command -v whisperx >/dev/null; then
  tmp="$(mktemp -d)"
  whisperx "$video" --model base --compute_type int8 --output_format txt --output_dir "$tmp" >/dev/null 2>&1
  mv "$tmp"/*.txt "$text"
  rm -rf "$tmp"
else
  echo "(not transcribed: Whisper isn't installed)" > "$text"
fi

printf '%s  %.0fs\n  frames: %s\n  words:  %s\n' "$name" "$duration" "$sheet" "$text"
