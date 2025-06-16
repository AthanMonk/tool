import React, { useEffect, useState } from 'react';
import './App.css';

const PRODUCT_TYPES = [
	{
		label: 'CARBONLESS FORMS - Black',
		value: 'carbonless-black',
		csv: 'https://raw.githubusercontent.com/AthanMonk/tc/refs/heads/main/1-Carbonless-Forms-Black.csv',
		options: [
			{ label: 'Sides', key: 'sides' },
			{ label: 'Parts/Paper Color', key: 'parts' },
			{ label: 'Size', key: 'size' },
			{ label: 'Quantity', key: 'quantity' },
		],
	},
	{
		label: 'CARBONLESS FORMS - Full Color',
		value: 'carbonless-fullcolor',
		csv: 'https://raw.githubusercontent.com/AthanMonk/tc/refs/heads/main/2-Carbonless-Forms-Full-Color.csv',
		options: [
			{ label: 'Parts/Paper Color', key: 'parts' },
			{ label: 'Size', key: 'size' },
			{ label: 'Quantity', key: 'quantity' },
		],
	},
];

function parseCSV(csv: string) {
	const [header, ...rows] = csv.trim().split(/\r?\n/);
	const keys = header.split(',');
	return rows.map((row) => {
		const values = row.split(',');
		const obj: Record<string, string> = {};
		keys.forEach((k, i) => (obj[k.trim()] = values[i]?.trim() || ''));
		return obj;
	});
}

const App: React.FC = () => {
	const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
	const [csvData, setCsvData] = useState<any[]>([]);
	const [options, setOptions] = useState<Record<string, string>>({});
	const [price, setPrice] = useState<string>('-');

	// Fetch CSV when product type changes
	useEffect(() => {
		fetch(productType.csv)
			.then((res) => res.text())
			.then((text) => setCsvData(parseCSV(text)))
			.catch(() => setCsvData([]));
		setOptions({});
		setPrice('-');
	}, [productType]);

	// Update price when options change
	useEffect(() => {
		if (!csvData.length) return;
		// Find row matching all selected options
		const row = csvData.find((r) =>
			productType.options.every(
				(opt) => !options[opt.key] || r[opt.label] === options[opt.key]
			)
		);
		setPrice(row?.Price || '-');
	}, [options, csvData, productType]);

	// Get unique values for each option
	const getOptionValues = (label: string) => {
		const values = Array.from(
			new Set(csvData.map((row) => row[label]).filter(Boolean))
		);
		return values;
	};

	return (
		<div className="pricing-tool-container">
			<div className="price-display">${price}</div>
			<select
				className="product-type-select"
				value={productType.value}
				onChange={(e) => {
					const pt = PRODUCT_TYPES.find(
						(pt) => pt.value === e.target.value
					);
					if (pt) setProductType(pt);
				}}
			>
				{PRODUCT_TYPES.map((pt) => (
					<option key={pt.value} value={pt.value}>
						{pt.label}
					</option>
				))}
			</select>
			<div>
				{productType.options.map((opt) => (
					<select
						key={opt.key}
						className="option-select"
						value={options[opt.key] || ''}
						onChange={(e) =>
							setOptions((o) => ({ ...o, [opt.key]: e.target.value }))
						}
						disabled={!csvData.length}
					>
						<option value="">Select {opt.label}</option>
						{getOptionValues(opt.label).map((val) => (
							<option key={val} value={val}>
								{val}
							</option>
						))}
					</select>
				))}
			</div>
		</div>
	);
};

export default App;
