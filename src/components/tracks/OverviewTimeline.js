import React, { memo, useState } from 'react';
import cn from 'classnames';
import { Link } from 'gatsby';

import { usePersistScrollPosition } from '../../hooks';

import * as css from './OverviewTimeline.module.css';

const usePaths = (chapters, track, trackPosition) => {
  const flatTrack = chapters
    .flatMap((chapter) => chapter.videos)
    .flatMap((video) =>
      video.parts?.length > 0
        ? video.parts.map((_, partIndex) => ({
            slug: video.slug,
            partIndex,
            isMultiPart: true
          }))
        : [{ slug: video.slug, partIndex: 0, isMultiPart: false }]
    );
  const currentVideo =
    chapters[trackPosition.chapterIndex].videos[trackPosition.videoIndex];
  const currentIndex = flatTrack.findIndex(
    (video) =>
      video.slug === currentVideo.slug &&
      video.partIndex === trackPosition.partIndex
  );
  const prevVideo = flatTrack[currentIndex - 1];
  const nextVideo = flatTrack[currentIndex + 1];
  const computePath = (video) => {
    if (video) {
      const hash = video.isMultiPart ? `#part-${video.partIndex + 1}` : '';
      return {
        ...video,
        path: `/tracks/${track.slug}/${video.slug}${hash}`
      };
    }
    return null;
  };
  return [computePath(prevVideo), computePath(nextVideo)];
};

const OverviewTimeline = ({
  className,
  chapters,
  track,
  trackPosition,
  onSelection = () => {}
}) => {
  const [previousVideo, nextVideo] = usePaths(chapters, track, trackPosition);

  const timelineRef = usePersistScrollPosition(track.slug, 'tracks');
  return (
    <div className={cn(css.root, className)}>
      <div className={css.overviewTimeline} ref={timelineRef}>
        {chapters.map((chapter, index) => (
          <ChapterSection
            key={index}
            chapter={chapter}
            chapterIndex={index}
            chapters={chapters}
            track={track}
            trackPosition={trackPosition}
            onSelection={onSelection}
          />
        ))}
      </div>
      <div className={css.navigation}>
        {previousVideo !== null && (
          <Link
            className={css.navButton}
            to={previousVideo.path}
            onClick={onSelection}>
            Previous
          </Link>
        )}
        {nextVideo !== null && (
          <Link
            className={css.navButton}
            to={nextVideo.path}
            onClick={onSelection}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
};

const ChapterSection = memo(
  ({ chapter, chapterIndex, chapters, track, trackPosition, onSelection }) => {
    const hasSeenChapter = chapterIndex < trackPosition.chapterIndex;
    const isThisChapter = chapterIndex === trackPosition.chapterIndex;
    const trackPath = `/tracks/${track.slug}`;
    const [collapsed, setCollapsed] = useState(false);

    const { videoIndex: currentVideoIndex } = trackPosition;

    return (
      <ul className={css.chapterList}>
        {chapter.title && (
          <li>
            <button
              className={cn(
                css.chapterTitle,
                { [css.expanded]: !collapsed },
                { [css.hasSeen]: hasSeenChapter || isThisChapter }
              )}
              onClick={() => setCollapsed((c) => !c)}>
              {chapter.title}
            </button>
          </li>
        )}
        {!collapsed &&
          chapter.videos.map((video, videoIndex) => {
            const hasSeenVideo =
              hasSeenChapter ||
              (isThisChapter && videoIndex <= currentVideoIndex);
            const isLastVideo =
              (hasSeenChapter &&
                videoIndex === chapters[chapterIndex].videos.length - 1) ||
              (isThisChapter && videoIndex === currentVideoIndex);
            const isMultiPart = video.parts?.length > 0;

            return isMultiPart ? (
              video.parts.map((part, partIndex) => {
                const currentPartIndex = trackPosition.partIndex;
                const hasSeenPart =
                  hasSeenVideo &&
                  (videoIndex < currentVideoIndex ||
                    partIndex <= currentPartIndex);
                return (
                  <li
                    key={`${video.slug}-${partIndex}`}
                    className={cn(css.videoItem, {
                      [css.seen]: hasSeenPart,
                      [css.last]: isLastVideo && partIndex === currentPartIndex
                    })}>
                    <Link
                      to={`${trackPath}/${video.slug}#part-${partIndex + 1}`}
                      onClick={onSelection}>
                      {video.title} - {part.title}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li
                key={video.slug}
                className={cn(css.videoItem, {
                  [css.seen]: hasSeenVideo,
                  [css.last]: isLastVideo
                })}>
                <Link to={`${trackPath}/${video.slug}`} onClick={onSelection}>
                  {video.title}
                </Link>
              </li>
            );
          })}
      </ul>
    );
  }
);

export default memo(OverviewTimeline);
