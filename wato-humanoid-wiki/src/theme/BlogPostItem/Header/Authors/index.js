import React from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogAuthor from '@theme/Blog/Components/Author';
import styles from './styles.module.css';

export default function BlogPostItemHeaderAuthors({className}) {
  const {
    metadata: {authors},
    assets,
  } = useBlogPost();
  const authorsCount = authors.length;
  if (authorsCount === 0) {
    return null;
  }
  return (
    <div
      className={clsx('margin-top--md margin-bottom--sm', styles.authorsRow, className)}>
      {authors.map((author, idx) => (
        <div className={styles.authorCol} key={idx}>
          <BlogAuthor
            author={{
              ...author,
              imageURL: assets.authorsImageUrls[idx] ?? author.imageURL,
            }}
          />
        </div>
      ))}
    </div>
  );
}
