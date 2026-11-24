export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string; // строка с двумя знаками, как в контракте
  available: boolean;
};

export type MenuSection = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type OpeningHours = {
  day: number; // 1 = понедельник ... 7 = воскресенье
  opens: string;
  closes: string;
};

// Меню здесь нет: в API оно отдаётся отдельной операцией getMenu
export type Restaurant = {
  id: string;
  name: string;
  city: string;
  description: string; // короткая строка для карточки
  about: string; // абзац для страницы ресторана
  address: string;
  phone: string;
  image?: string; // фото для карточки каталога
  hours: OpeningHours[];
};

const hours: OpeningHours[] = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  day,
  opens: '10:00',
  closes: '23:00',
}));

// Временное меню, одно на все рестораны, пока нет API
export const menu: MenuSection[] = [
  {
    id: 'salads',
    name: 'Салаты и закуски',
    items: [
      {
        id: 'i1',
        name: 'Салат с печёной свёклой',
        description: 'Мягкий сыр, руккола, грецкий орех и медовая заправка',
        price: '390.00',
        available: true,
      },
      {
        id: 'i2',
        name: 'Томаты с бурратой',
        description: 'Спелые томаты, базилик и оливковое масло',
        price: '520.00',
        available: true,
      },
      {
        id: 'i3',
        name: 'Хумус с тёплой питой',
        description: 'Нут, тахини, печёный перец и пряное масло',
        price: '320.00',
        available: true,
      },
      {
        id: 'i13',
        name: 'Сырная тарелка',
        description: 'Ассорти из трёх сыров',
        price: '780.00',
        available: false,
      },
    ],
  },
  {
    id: 'hot',
    name: 'Горячие блюда',
    items: [
      {
        id: 'i4',
        name: 'Курица с травами',
        description: 'Филе на гриле, картофельное пюре и сливочный соус',
        price: '590.00',
        available: true,
      },
      {
        id: 'i5',
        name: 'Паста с грибами',
        description: 'Тальятелле, шампиньоны, сливки и пармезан',
        price: '480.00',
        available: true,
      },
      {
        id: 'i6',
        name: 'Форель с овощами',
        description: 'Запечённое филе, сезонные овощи и лимон',
        price: '780.00',
        available: true,
      },
    ],
  },
  {
    id: 'desserts',
    name: 'Десерты',
    items: [
      {
        id: 'i7',
        name: 'Чизкейк с ягодами',
        description: 'Нежный сливочный сыр, песочная основа и ягодный соус',
        price: '310.00',
        available: true,
      },
      {
        id: 'i8',
        name: 'Медовик',
        description: 'Тонкие медовые коржи и сметанный крем',
        price: '280.00',
        available: true,
      },
      {
        id: 'i9',
        name: 'Шоколадный фондан',
        description: 'Тёплый шоколадный кекс с ванильным мороженым',
        price: '350.00',
        available: true,
      },
    ],
  },
  {
    id: 'drinks',
    name: 'Напитки',
    items: [
      {
        id: 'i10',
        name: 'Чай с мятой и лимоном',
        description: 'Чёрный чай, свежая мята и лимон · 600 мл',
        price: '240.00',
        available: true,
      },
      {
        id: 'i11',
        name: 'Домашний лимонад',
        description: 'Лимон, апельсин и свежая мята · 400 мл',
        price: '220.00',
        available: true,
      },
      {
        id: 'i12',
        name: 'Капучино',
        description: 'Эспрессо и нежная молочная пена · 250 мл',
        price: '190.00',
        available: true,
      },
    ],
  },
];

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Мята и свет',
    city: 'Бишкек',
    description: 'Современная кухня · Светлый зал',
    about:
      'Светлое место для неспешного обеда и тёплых встреч. Знакомые вкусы в современном прочтении, сезонные овощи и домашние десерты.',
    address: 'ул. Токтогула, 120',
    phone: '+996 (XXX) XXX-XXX',
    image: '/images/restaurant-1.jpg',
    hours,
  },
  {
    id: '2',
    name: 'Тихий двор',
    city: 'Ош',
    description: 'Восточная кухня · Зелёный дворик',
    about: 'Уютный дворик с восточной кухней для семейных обедов.',
    address: 'ул. Ленина, 5',
    phone: '+996 (XXX) XXX-XXX',
    image: '/images/restaurant-2.jpg',
    hours,
  },
  {
    id: '3',
    name: 'Зелёный уголок',
    city: 'Бишкек',
    description: 'Вегетарианская кухня · Уютный зал',
    about: 'Вегетарианская кухня из сезонных продуктов.',
    address: 'пр. Чуй, 100',
    phone: '+996 (XXX) XXX-XXX',
    image: '/images/restaurant-3.jpg',
    hours,
  },
  {
    id: '4',
    name: 'Кофейная гавань',
    city: 'Каракол',
    description: 'Кофе и десерты · Комфортная терраса',
    about: 'Кофе, десерты и терраса с видом на горы.',
    address: 'ул. Абдрахманова, 20',
    phone: '+996 (XXX) XXX-XXX',
    image: '/images/restaurant-4.jpg',
    hours,
  },
];
