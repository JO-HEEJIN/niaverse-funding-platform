export interface FundingOption {
  id: string;
  title: string;
  description: string;
  image: string;
  basePrice: number;
  unit: 'Won' | 'Doji' | 'VAST';
  priceStructure: {
    quantity: number;
    price: number;
  }[];
  details: {
    category: string;
    status: 'active' | 'completed' | 'upcoming';
    endDate: string;
    totalRaised: number;
    goal: number;
  };
  dailyIncome?: number;
  aboutProject?: string[];
}

export const fundingOptions: FundingOption[] = [
  {
    id: '1',
    title: '펀딩 I',
    description: '도지코인 채굴 사업으로 안정적인 수익을 얻으세요. 최신 NIA Cloud 기술과 친환경 에너지를 활용하여 글로벌 파트너십을 통한 안정적 수익을 제공합니다.',
    image: '/api/placeholder/400/300',
    basePrice: 100000,
    unit: 'Doji',
    dailyIncome: 100,
    priceStructure: [
      { quantity: 1, price: 100000 },
      { quantity: 2, price: 190000 },
      { quantity: 3, price: 270000 },
      { quantity: 5, price: 450000 },
    ],
    details: {
      category: 'Cryptocurrency',
      status: 'completed',
      endDate: '2024-12-31',
      totalRaised: 3000000000,
      goal: 3000000000,
    },
    aboutProject: [
      '• 도지코인채굴 사업은 높은 성장 잠재력을 지닌 미래 지향적 산업입니다.',
      '• 우리 회사는 최신 NIA Cloud 기술과 친환경 에너지 활용으로 시장에서 독보적인 위치를 확보하고 있습니다.',
      '• 글로벌 파트너십을 통해 기술력과 원가 경쟁력을 지속적으로 강화하고 있습니다.',
      '• 시장 변동성에 대비한 탄탄한 리스크 관리 전략을 갖추고 있습니다.',
      '채굴기의 혁신적 기술',
      '• NIA Cloud 채굴기는 도지코인 채굴에 특화된 고성능 USB TYPE 의 장비입니다.',
      '• 클라우드 기반 네트워크로 유연성있게 확장 및 조정할 수 있도록 설계되어 있으며 높은 해시레이트와 에너지 효율성이 특징입니다.',
      'NIA Cloud 최신 채굴기 기술 동향',
      '• NIA Cloud는 도지코인 채굴에 최적화되어 있어 효율성이 뛰어납니다.',
      '• 최신 트렌드는 7nm, 5nm 공정을 적용한 고효율 도지 채굴기 개발과 친환경 에너지 활용에 초점을 맞추고 있습니다.'
    ],
  },
  {
    id: '2',
    title: '펀딩 II',
    description: '태양광 기반 데이터센터는 전기를 무상 공급 없이 연평균 수익을 향상시키며, 친환경적이고 장기적인 차익 가능성이 높습니다. 전기료 변동에 영향을 받지 않아 예측 가능한 수익 구조를 가지고 있으며, 초기 투자 이후 운영 비용이 크게 감소합니다. 데이터센터 운영자들은 커져만가는 많은 컴퓨팅 애플리케이션의 중기에 따라 에너지 효율성을 높이기 위해 수년 기술을 접목하고 있습니다. Dell/Oro Group에 따르면, 기업들이 클라우드 서비스를 더욱 많이 도입하고, 인공지능(AI)을 활용하여 고급 분석 및 자동화된 의사 결정을 강화하며, 블록체인 및 앞으로의 애플리케이션을 활성화함에 따라 수년 시장의 매출은 2017년부터 지 20년 달러에 이를 것으로 예상되며, 2020년부터 2027년까지 연평균 60% 성장할 것으로 보입니다.',
    image: '/api/placeholder/400/300',
    basePrice: 1000000,
    unit: 'Won',
    priceStructure: [
      { quantity: 1, price: 1000000 },
      { quantity: 2, price: 2000000 },
      { quantity: 3, price: 2900000 },
      { quantity: 5, price: 4750000 },
    ],
    details: {
      category: 'Infrastructure',
      status: 'active',
      endDate: '2024-11-30',
      totalRaised: 1020000000,
      goal: 3000000000,
    },
    aboutProject: [
      '태양광 기반 데이터센터는 전기를 무상 공급 없이 연평균 수익을 향상시키며, 친환경적이고 장기적인 차익 가능성이 높습니다. 전기료 변동에 영향을 받지 않아 예측 가능한 수익 구조를 가지고 있으며, 초기 투자 이후 운영 비용이 크게 감소합니다.',
      '데이터센터 운영자들은 커져만가는 많은 컴퓨팅 애플리케이션의 중기에 따라 에너지 효율성을 높이기 위해 수년 기술을 접목하고 있습니다. Dell/Oro Group에 따르면, 기업들이 클라우드 서비스를 더욱 많이 도입하고, 인공지능(AI)을 활용하여 고급 분석 및 자동화된 의사 결정을 강화하며, 블록체인 및 앞으로의 애플리케이션을 활성화함에 따라 수년 시장의 매출은 2017년부터 지 20년 달러에 이를 것으로 예상되며, 2020년부터 2027년까지 연평균 60% 성장할 것으로 보입니다.',
      '이 혁신적인 프로젝트는 지속가능한 에너지 솔루션과 최첨단 데이터센터 기술을 결합하여 투자자들에게 장기적이고 안정적인 수익을 제공합니다.'
    ],
  },
  {
    id: '3',
    title: '펀딩 III',
    description: '디지털 참여 혁신 플랫폼으로 DeFi 보상 시스템을 통해 연 20% 유동성 인센티브를 제공합니다. 단일 토큰 스테이킹으로 간편하게 수익을 얻으세요.',
    image: '/api/placeholder/400/300',
    basePrice: 500000,
    unit: 'VAST',
    priceStructure: [
      { quantity: 1, price: 500000 },
      { quantity: 2, price: 950000 },
      { quantity: 3, price: 1400000 },
      { quantity: 5, price: 2250000 },
    ],
    details: {
      category: 'Cryptocurrency',
      status: 'active',
      endDate: '2025-01-15',
      totalRaised: 5360000000,
      goal: 8000000000,
    },
    aboutProject: [
      '$VAST는 디지털 참여의 혁신을 이끌며, 모든 상호작용을 실제 가치로 바꿉니다. 신뢰할 수 있는 스마트 계약 기반으로 구축되어, 창작자, 브랜드, 퍼블리셔가 참여를 투명하게 측정하고 수익화할 수 있도록 지원합니다.',
      '중간자는 없고, 추측도 필요 없습니다. $VAST와 함께라면, 사람들은 단순히 스크롤하지 않고, 참여하고, 보상받으며, 모두가 이익을 얻는 활기찬 콘텐츠 경제를 만들어갑니다.',
      'VAST는 단순한 참여를 넘어, 실질적인 디파이(DeFi) 보상으로 확장됩니다. 탈중앙화 프로젝트인 $VAST는 수익 파밍(yield farming)과 단일 토큰 스테이킹(single-token staking) 같은 강력한 수익 기회를 제공합니다.',
      '전체 공급량의 20%는 유동성 인센티브에 할당되어 있으며, 사용자는 VAST 플랫폼과 파트너 생태계에서 유동성을 제공하거나 스테이킹함으로써 보상을 받을 수 있습니다. 단순히 보유하는 것을 넘어, 함께 성장하는 것이 핵심입니다.'
    ],
  },
];