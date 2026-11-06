---
name: drive-structure
description: Sets up one clear Google Drive structure for an agency's client assets, so AI can find the right hooks, bodies, B-roll and images when it makes an ad. Looks through one example client's folder, asks how you'd want it split, builds the structure with you, saves it as a template, then applies it to every client. Use when setting up or tidying client Drive folders, or onboarding a new client.
---

# Drive structure

Builds one structure for every client's assets in Google Drive. Assets get split by what
they are, labelled by what's in them, and the good kept apart from the bad. That way, when
AI makes an ad, the brief can point at real assets and the AI knows where to find them.

The person makes every call. This skill looks, asks and suggests. It never changes a
file without a yes.

## What it needs

- **Claude Code**, so it can run commands on this computer.
- **Google Drive tools** that can search, create folders, move files and rename them,
  such as the Google Drive connector.
- **Google Drive for desktop**, so the example client's videos can be watched locally.
- **ffmpeg**, to pull frames out of videos. **Whisper** (or WhisperX) to transcribe
  what's said. Without Whisper it still works from frames alone, just less accurately.

## Before starting

Look for `template.md` next to this file.

- **It exists:** the structure is already agreed. Read it, then skip to step 7 for an
  existing client or step 8 for a new one.
- **It doesn't:** start at step 1.

## Step 1 · Find the client folders

1. Check the setup. Search Drive for any folder to make sure the Drive tools work. Run
   `ffmpeg -version` and check for `whisper` or `whisperx`. If something's missing, say
   what it is and give the install command (`brew install ffmpeg`,
   `pip install openai-whisper`). Let the person run it; never install anything without
   a yes.
2. Ask where the client folders live: one parent folder, a shared drive or scattered
   around. List the client folders found.
3. Ask them to pick one client as the example. The best one has plenty of assets and is
   a bit of a mess, because it shows the most.
4. List what's in that client's folder: the subfolders, how many videos and images, and
   how files are named now.

## Step 2 · Watch the example

1. Ask the person to make that client's folder available offline: in Google Drive for
   desktop, right-click the folder, then **Offline access** → **Available offline**.
   Wait until it has finished downloading.
2. Find the folder on this computer. It's usually under
   `~/Library/CloudStorage/GoogleDrive-<their email>/` on a Mac, inside `My Drive` or
   `Shared drives`. Confirm the path with them.
3. For each video, run `bash scripts/look.sh "<video>" "<notes folder>"`. It saves a contact
   sheet of 12 frames from across the video and, if Whisper is installed, a transcript.
   Look at the contact sheet and read the transcript. Keep the notes folder outside
   Drive, for example `~/drive-structure-notes/<client>/`.
4. Open images directly to look at them.
5. Write a line per file in `inventory.md` in the notes folder: the file, what it is
   (hook, body, B-roll, testimonial, static, product shot or whatever fits), what's in
   it, and whether it looks usable.
6. Run one video at a time. If the folder has more than about 40 files, look at a spread
   of them first and say so, rather than going through all of them before talking.

## Step 3 · Analyse, then ask

Show what was found, in short: the kinds of assets there are, how they're named now,
what's mixed together, and what's hard to find.

Then ask questions, one at a time, and wait for each answer:

1. How would you want this split up? Do you have any thoughts on it already?
2. Which kinds of asset do you actually use when you make ads? (For example: hooks,
   bodies, B-roll, testimonials, UGC, statics, product shots, finished ads.)
3. How do you decide what's good and what's not? (For example: it's been in an ad that
   worked, the quality, or the team's judgement.)
4. How should files be named, so anyone can tell what's in a file without opening it?
5. Where do raw, unedited takes go? A single take can hold a hook and a body, and one
   file can't sit in two folders.
6. Anything else every client folder needs, such as brand guidelines, logos or briefs?

Skip any question they've already answered.

## Step 4 · Build the base structure

Put together a structure from their answers. Show it as a folder tree, with:

- the folders and what goes in each;
- the naming rule, with two or three real examples from the example client;
- how good is kept apart from bad;
- a `To sort` folder for anything unclear.

Rework it until they say yes. Only suggest a structure of your own if they ask for one.

## Step 5 · Save it as the template

Write the agreed structure to `template.md` next to this file: the folder tree, what
goes in each folder, the naming rule with examples, the good and bad rule, and their
answers from step 3. If they keep a brain or a docs folder for their business, ask if
they'd like a copy there too.

From now on this skill uses the template, so every client gets exactly the same setup.

## Step 6 · Apply it to the example client

1. Make a plan, shown as a table: each folder to create, and each file with where it
   goes and its new name.
2. Wait for a yes. Change anything they point at.
3. Create the folders, then move and rename the files using the Drive tools.
4. Write every change to `log.md` in the notes folder: the old name and folder, the new
   name and folder, and the time. That's how a change gets undone.
5. When done, say what moved, what went into `To sort`, and anything that failed.
6. Tell them they can turn off offline access for that folder now, to free up space.

## Step 7 · Roll it out to every client

Go one client at a time, in an order the person picks:

1. Make the client's folder available offline, as in step 2.
2. Look through its files and write its `inventory.md`.
3. Show the plan as in step 6 and wait for a yes.
4. Apply it, log it, report, and turn offline access back off.

Ask before moving on to the next client.

## Step 8 · New clients

When a new client comes on, create the empty structure from `template.md` in their
folder. If they've already sent assets, sort them the same way as step 7.

## Undo

If they want something put back, use `log.md` to move and rename the files back to
where they were, and show the plan first.

## Rules

- **Nothing changes without a yes.** Every move and rename is shown as a plan first.
- **Never delete.** No file is deleted or trashed, ever. Duplicates and junk go into
  `To sort` for the person to deal with.
- **Never overwrite.** If a new name is already taken, add a number to the end.
- **Log everything.** Every change goes into `log.md` so it can be undone.
- **One video at a time.** Watching videos is heavy work for a laptop.
- **Their call.** The person decides the structure. Ask before assuming.
