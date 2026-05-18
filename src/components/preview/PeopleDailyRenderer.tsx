import { useEffect, useState } from 'react';

import {
  buildPeopleDailyDocument,
  type PeopleDailyImage,
  type PeopleDailyPage,
  type PeopleDailyStory,
} from '../../layouts/peopleDailyLayout';
import {
  getLocalImageAsset,
  parseLocalImageReference,
  readBlobAsDataUrl,
} from '../../utils/localImages';

interface PeopleDailyRendererProps {
  markdown: string;
}

interface ContinuationStoryPage {
  pageNumber: number;
  stories: PeopleDailyStory[];
}

const FRONT_PAGE_PARAGRAPH_LIMITS = [2, 1, 1, 1, 1, 2];
const CONTINUATION_PARAGRAPH_TARGET = 14;

export function PeopleDailyRenderer({ markdown }: PeopleDailyRendererProps) {
  const document = buildPeopleDailyDocument(markdown);

  return (
    <div
      className="people-daily-layout"
      data-testid="people-daily-layout"
      data-variant={document.variant}
    >
      {document.variant === 'front-page' ? (
        <FrontPageDocument
          title={document.title}
          subtitle={document.subtitle}
          stories={document.stories}
          images={document.images}
        />
      ) : (
        <ArticlePage
          title={document.title}
          subtitle={document.subtitle}
          pages={document.pages}
          images={document.images}
          compact={document.variant === 'brief'}
        />
      )}
    </div>
  );
}

interface FrontPageDocumentProps {
  title: string;
  subtitle: string;
  stories: PeopleDailyStory[];
  images: PeopleDailyImage[];
}

function FrontPageDocument({ title, subtitle, stories, images }: FrontPageDocumentProps) {
  const { frontStories, continuationStories } = splitFrontPageStories(stories);
  const continuationPages = paginateStories(continuationStories, 2);

  return (
    <>
      <FrontPage title={title} subtitle={subtitle} stories={frontStories} image={images[0]} />
      <StoryContinuationPages pages={continuationPages} />
    </>
  );
}

interface FrontPageProps {
  title: string;
  subtitle: string;
  stories: PeopleDailyStory[];
  image?: PeopleDailyImage;
}

function FrontPage({ title, subtitle, stories, image }: FrontPageProps) {
  const leadStory = stories[0];
  const imageStory = stories[1];
  const smallStories = stories.slice(2, 5);
  const lowerStory = stories[5];

  return (
    <NewspaperPage pageNumber={1} className="people-daily-page--front">
      <section className="people-daily-lead">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </section>

      <div className="people-daily-front-grid">
        {leadStory ? (
          <article className="people-daily-story people-daily-story--lead">
            <h2>{leadStory.title}</h2>
            <ColumnText paragraphs={leadStory.paragraphs} columns={3} />
          </article>
        ) : null}

        {imageStory ? (
          <article className="people-daily-story people-daily-story--image">
            {image ? <NewspaperImage image={image} /> : null}
            <h2>{imageStory.title}</h2>
            <ColumnText paragraphs={imageStory.paragraphs} columns={2} />
          </article>
        ) : null}

        {smallStories.map((story, index) => (
          <article className={`people-daily-story people-daily-story--small-${index + 1}`} key={story.title}>
            <h2>{story.title}</h2>
            <ColumnText paragraphs={story.paragraphs} columns={2} />
          </article>
        ))}

        {lowerStory ? (
          <article className="people-daily-story people-daily-story--bottom">
            <h2>{lowerStory.title}</h2>
            <ColumnText paragraphs={lowerStory.paragraphs} columns={5} />
          </article>
        ) : null}
      </div>
    </NewspaperPage>
  );
}

interface ArticlePageProps {
  title: string;
  subtitle: string;
  pages: PeopleDailyPage[];
  images: PeopleDailyImage[];
  compact: boolean;
}

function ArticlePage({ title, subtitle, pages, images, compact }: ArticlePageProps) {
  return (
    <>
      {pages.map((page, index) => (
        <NewspaperPage
          pageNumber={page.pageNumber}
          className={compact ? 'people-daily-page--brief' : 'people-daily-page--article'}
          key={page.pageNumber}
        >
          {index === 0 ? (
            <section className="people-daily-article-head">
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
              {images[0] ? <NewspaperImage image={images[0]} /> : null}
            </section>
          ) : (
            <div className="people-daily-continuation-title">接上版</div>
          )}
          <ColumnText paragraphs={page.paragraphs} columns={compact ? 2 : 4} />
        </NewspaperPage>
      ))}
    </>
  );
}

interface StoryContinuationPagesProps {
  pages: ContinuationStoryPage[];
}

function StoryContinuationPages({ pages }: StoryContinuationPagesProps) {
  return (
    <>
      {pages.map((page) => (
        <NewspaperPage
          pageNumber={page.pageNumber}
          className="people-daily-page--article"
          key={page.pageNumber}
        >
          <div className="people-daily-continuation-title">接上版</div>
          <div className="people-daily-continuation-stories">
            {page.stories.map((story) => (
              <article className="people-daily-continuation-story" key={`${page.pageNumber}-${story.title}`}>
                <h2>{story.title}</h2>
                <ColumnText paragraphs={story.paragraphs} columns={3} />
              </article>
            ))}
          </div>
        </NewspaperPage>
      ))}
    </>
  );
}

interface NewspaperPageProps {
  pageNumber: number;
  className: string;
  children: React.ReactNode;
}

function NewspaperPage({ pageNumber, className, children }: NewspaperPageProps) {
  return (
    <article
      aria-label={`人民日报版面 第 ${pageNumber} 页`}
      className={`people-daily-page ${className}`}
    >
      <header className="people-daily-masthead">
        <div className="people-daily-logo">人民日报</div>
        <div className="people-daily-meta">
          <span>{formatPublicationDate(new Date())}</span>
          <span>第 {pageNumber} 版</span>
        </div>
      </header>
      {children}
    </article>
  );
}

interface ColumnTextProps {
  paragraphs: string[];
  columns: number;
}

function ColumnText({ paragraphs, columns }: ColumnTextProps) {
  const content = paragraphs.length > 0 ? paragraphs : [''];

  return (
    <div className="people-daily-columns" style={{ columnCount: columns }}>
      {content.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

interface NewspaperImageProps {
  image: PeopleDailyImage;
}

function NewspaperImage({ image }: NewspaperImageProps) {
  const [resolved, setResolved] = useState<{ source: string; src: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const localReference = parseLocalImageReference(image.src);

    if (!localReference) {
      return;
    }

    void getLocalImageAsset(localReference.id).then(async (asset) => {
      if (cancelled || !asset) {
        return;
      }
      const src = await readBlobAsDataUrl(asset.blob);
      if (!cancelled) {
        setResolved({ source: image.src, src });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [image.src]);

  const localReference = parseLocalImageReference(image.src);
  const src = localReference ? (resolved?.source === image.src ? resolved.src : null) : image.src;

  if (!src) {
    return <div className="people-daily-photo people-daily-photo--empty">{image.alt || '图片加载中'}</div>;
  }

  return <img className="people-daily-photo" alt={image.alt} src={src} loading="eager" />;
}

function splitFrontPageStories(stories: PeopleDailyStory[]): {
  frontStories: PeopleDailyStory[];
  continuationStories: PeopleDailyStory[];
} {
  const frontStories: PeopleDailyStory[] = [];
  const continuationStories: PeopleDailyStory[] = [];

  stories.forEach((story, index) => {
    const limit = FRONT_PAGE_PARAGRAPH_LIMITS[index];
    if (limit === undefined) {
      continuationStories.push(story);
      return;
    }

    frontStories.push({
      title: story.title,
      paragraphs: story.paragraphs.slice(0, limit),
    });

    const remainingParagraphs = story.paragraphs.slice(limit);
    if (remainingParagraphs.length > 0) {
      continuationStories.push({
        title: story.title,
        paragraphs: remainingParagraphs,
      });
    }
  });

  return { frontStories, continuationStories };
}

function paginateStories(stories: PeopleDailyStory[], startPage: number): ContinuationStoryPage[] {
  const pages: ContinuationStoryPage[] = [];
  let currentStories: PeopleDailyStory[] = [];
  let currentWeight = 0;

  function flush() {
    if (currentStories.length === 0) {
      return;
    }
    pages.push({
      pageNumber: startPage + pages.length,
      stories: currentStories,
    });
    currentStories = [];
    currentWeight = 0;
  }

  for (const story of stories) {
    const storyWeight = Math.max(1, story.paragraphs.length) + 1;
    if (currentStories.length > 0 && currentWeight + storyWeight > CONTINUATION_PARAGRAPH_TARGET) {
      flush();
    }
    currentStories.push(story);
    currentWeight += storyWeight;
  }

  flush();
  return pages;
}

function formatPublicationDate(date: Date): string {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}
