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

	// Get unique values for each option, filtered by previous selections
	const getOptionValues = (opt: any, currentOptions: Record<string, string>) => {
		// Filter csvData by previous selections (for options before this one)
		const optIndex = productType.options.findIndex((o) => o.key === opt.key);
		const filterKeys = productType.options.slice(0, optIndex).map((o) => o.key);
		const filteredRows = csvData.filter((row) =>
			filterKeys.every((k) => {
				const optionDef = productType.options.find((o) => o.key === k);
				if (!optionDef) return true;
				if (k === 'parts' && row['Parts'] && row['Paper Color']) {
					const display = `${row['Parts']} Part - ${row['Paper Color']}`;
					return (
						currentOptions[k] === row['Parts'] ||
						currentOptions[k] === display
					);
				}
				return row[optionDef.csvColumn] === currentOptions[k];
			})
		);

		if (opt.key === 'parts') {
			const values = Array.from(
				new Set(
					filteredRows
						.filter((row) => row['Parts'] && row['Paper Color'])
						.map((row) => `${row['Parts']} Part - ${row['Paper Color']}`)
					)
			);
			return values;
		}
		let values = Array.from(
			new Set(filteredRows.map((row) => row[opt.csvColumn]).filter(Boolean))
		);
		// For quantity, sort numerically
		if (opt.key === 'quantity') {
			values = values.map(Number).sort((a, b) => a - b).map(String);
		}
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
									if (val.includes('Part -')) return val;
									const found = getOptionValues(opt, options).find((v) => v.startsWith(val));
									return found || '';
								})()
							: options[opt.key] || ''
						}
						onChange={(e) => {
							let val = e.target.value;
							if (opt.key === 'parts') {
								val = val.split(' ')[0];
							}
							setOptions((o) => ({ ...o, [opt.key]: val }));
						}}
						disabled={!csvData.length}
					>
						<option value="">Select {opt.label}</option>
						{getOptionValues(opt, options).map((val) => (
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
