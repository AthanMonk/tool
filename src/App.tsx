import React, { useEffect, useState } from 'react';
import './App.css';

const PRODUCT_TYPES = [
	{
		label: 'CARBONLESS FORMS - Black',
		value: 'carbonless-black',
		csv: 'https://raw.githubusercontent.com/AthanMonk/tc/refs/heads/main/1-Carbonless-Forms-Black.csv',
		options: [
			{ label: 'Sides', key: 'sides', csvColumn: 'Sides' },
			{ label: 'Parts/Paper Color', key: 'parts', csvColumn: 'Parts', displayColumn: 'Paper Color' },
			{ label: 'Size', key: 'size', csvColumn: 'Size' },
			{ label: 'Quantity', key: 'quantity', csvColumn: 'Quantity' },
		],
		defaultOptions: {
			sides: 'Single',
			parts: '2',
			size: '5.5x8.5',
			quantity: '500',
		},
	},
	{
		label: 'CARBONLESS FORMS - Full Color',
		value: 'carbonless-fullcolor',
		csv: 'https://raw.githubusercontent.com/AthanMonk/tc/refs/heads/main/2-Carbonless-Forms-Full-Color.csv',
		options: [
			{ label: 'Parts/Paper Color', key: 'parts', csvColumn: 'Parts', displayColumn: 'Paper Color' },
			{ label: 'Size', key: 'size', csvColumn: 'Size' },
			{ label: 'Quantity', key: 'quantity', csvColumn: 'Quantity' },
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
		setOptions(productType.defaultOptions || {});
		setPrice('-');
	}, [productType]);

	// Update price when options change
	useEffect(() => {
		if (!csvData.length) return;
		// Find row matching all selected options
		const row = csvData.find((r) =>
			productType.options.every((opt) => {
				if (!options[opt.key]) return true;
				if (opt.key === 'parts' && r['Parts'] && r['Paper Color']) {
					// For display, combine Parts and Paper Color
					const display = `${r['Parts']} Part - ${r['Paper Color']}`;
					return (
						options[opt.key] === r['Parts'] ||
						options[opt.key] === display
					);
				}
				return r[opt.csvColumn] === options[opt.key];
			})
		);
		setPrice(row?.Price || '-');
	}, [options, csvData, productType]);

	// Get unique values for each option
	const getOptionValues = (opt: any) => {
		if (opt.key === 'parts') {
			// Combine Parts and Paper Color for display
			const values = Array.from(
				new Set(
					csvData
						.filter((row) => row['Parts'] && row['Paper Color'])
						.map((row) => `${row['Parts']} Part - ${row['Paper Color']}`)
				)
			);
			return values;
		}
		const values = Array.from(
			new Set(csvData.map((row) => row[opt.csvColumn]).filter(Boolean))
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
					const pt = PRODUCT_TYPES.find((pt) => pt.value === e.target.value);
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
						value={
							opt.key === 'parts'
								? (() => {
									const val = options[opt.key];
									if (!val) return '';
									// If already in display format, return as is
									if (val.includes('Part -')) return val;
									// Otherwise, find the first matching display value
									const found = getOptionValues(opt).find((v) => v.startsWith(val));
									return found || '';
								})()
							: options[opt.key] || ''
						}
						onChange={(e) => {
							let val = e.target.value;
							if (opt.key === 'parts') {
								// Store just the number of parts (e.g., '2')
								val = val.split(' ')[0];
							}
							setOptions((o) => ({ ...o, [opt.key]: val }));
						}}
						disabled={!csvData.length}
					>
						<option value="">Select {opt.label}</option>
						{getOptionValues(opt).map((val) => (
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
