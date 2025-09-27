import pandas as pd

csv_path = 'config\samples\\teams_sample.csv'
xlsx_path = 'config\samples\\teams_sample.xlsx'

df = pd.read_csv(csv_path)
df.to_excel(xlsx_path, index=False, sheet_name='Teams')
print(f'Generated: {xlsx_path}')