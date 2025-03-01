import { languages, LanguageTag } from '@logto/language-kit';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';

import { onKeyDownHandler } from '@/utilities/a11y';

import * as style from './LanguageItem.module.scss';

type Props = {
  languageTag: LanguageTag;
  isSelected: boolean;
  onClick: () => void;
};

const LanguageItem = ({ languageTag, isSelected, onClick }: Props) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) {
      itemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const handleSelect = () => {
    if (isSelected) {
      return;
    }
    onClick();
  };

  return (
    <div
      ref={itemRef}
      role="tab"
      tabIndex={0}
      aria-selected={isSelected}
      className={classNames(style.languageItem, isSelected && style.selected)}
      onClick={handleSelect}
      onKeyDown={onKeyDownHandler(handleSelect)}
    >
      <div className={style.languageName}>{languages[languageTag]}</div>
      <div className={style.languageTag}>{languageTag}</div>
    </div>
  );
};

export default LanguageItem;
