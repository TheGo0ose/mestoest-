import Image from 'next/image';

export function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full overflow-hidden"
    >
      <div className="relative mx-auto h-full max-w-6xl">
        {/* Декоративная тарелка с салатом слева (привязана к левой колонке поиска) */}
        <div className="absolute top-[280px] -left-75 sm:-left-75 lg:-left-75">
          <Image
            src="/images/plate-left.png"
            alt=""
            width={540}
            height={540}
            unoptimized
            priority
            className="h-auto w-[360px] opacity-90 drop-shadow-md select-none sm:w-[440px] lg:w-[500px]"
          />
        </div>

        {/* Декоративная тарелка справа (привязана к сетке карточек, не улетает к краю экрана) */}
        <div className="absolute top-[480px] -right-50 hidden sm:block lg:-right-50">
          <Image
            src="/images/plate-right.png"
            alt=""
            width={280}
            height={400}
            unoptimized
            className="h-auto w-[180px] opacity-80 drop-shadow-md select-none lg:w-[220px]"
          />
        </div>
      </div>
    </div>
  );
}
