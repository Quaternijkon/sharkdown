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

export function PeopleDailyRenderer({ markdown }: PeopleDailyRendererProps) {
  const document = buildPeopleDailyDocument(markdown);

  return (
    <div
      className="people-daily-layout"
      data-testid="people-daily-layout"
      data-variant={document.variant}
    >
      {document.variant === 'front-page' ? (
        <FrontPage
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

interface FrontPageProps {
  title: string;
  subtitle: string;
  stories: PeopleDailyStory[];
  images: PeopleDailyImage[];
}

function FrontPage({ title, subtitle, stories, images }: FrontPageProps) {
  const leadStory = stories[0];
  const secondaryStories = stories.slice(1, 5);
  const lowerStory = stories[5];

  return (
    <NewspaperPage pageNumber={1} className="people-daily-page--front">
      <section className="people-daily-lead">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </section>

      <div className="people-daily-front-grid">
        <article className="people-daily-story people-daily-story--lead">
          <h2>{leadStory?.title ?? title}</h2>
          <ColumnText paragraphs={leadStory?.paragraphs ?? []} columns={3} />
        </article>

        <article className="people-daily-story people-daily-story--image">
          <NewspaperImage image={images[0]} />
          <h2>{secondaryStories[0]?.title ?? '图片新闻'}</h2>
          <ColumnText paragraphs={secondaryStories[0]?.paragraphs ?? []} columns={2} />
        </article>

        {secondaryStories.slice(1, 4).map((story, index) => (
          <article className={`people-daily-story people-daily-story--small-${index + 1}`} key={story.title}>
            <h2>{story.title}</h2>
            <ColumnText paragraphs={story.paragraphs} columns={2} />
          </article>
        ))}

        <article className="people-daily-story people-daily-story--bottom">
          <h2>{lowerStory?.title ?? '综合报道'}</h2>
          <ColumnText
            paragraphs={lowerStory?.paragraphs ?? ['更多内容将根据正文篇幅自动流入后续版面。']}
            columns={5}
          />
        </article>
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
          <span>2026年5月18日 星期一</span>
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
  image?: PeopleDailyImage;
}

function NewspaperImage({ image }: NewspaperImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const localReference = parseLocalImageReference(image?.src);

    if (!image?.src || !localReference) {
      setResolvedSrc(null);
      return;
    }

    void getLocalImageAsset(localReference.id).then(async (asset) => {
      if (cancelled || !asset) {
        return;
      }
      const src = await readBlobAsDataUrl(asset.blob);
      if (!cancelled) {
        setResolvedSrc(src);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [image?.src]);

  if (!image) {
    return <div className="people-daily-photo people-daily-photo--empty">新闻图片</div>;
  }

  const localReference = parseLocalImageReference(image.src);
  const src = localReference ? resolvedSrc : image.src;

  if (!src) {
    return <div className="people-daily-photo people-daily-photo--empty">{image.alt || '图片加载中'}</div>;
  }

  return <img className="people-daily-photo" alt={image.alt} src={src} loading="eager" />;
}
