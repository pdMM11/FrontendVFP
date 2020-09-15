import {Component, Input, OnInit} from '@angular/core';
import {PeptideStructuresService} from '../../../services/peptide-structures.service';
import {
  NbGetters,
  NbSortDirection,
  NbSortRequest,
  NbTreeGridDataSource,
  NbTreeGridDataSourceBuilder,
} from '@nebular/theme';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';


interface PeptideStructuresInterface {
  idpeptide_structure?: string;
  exp_method?: string;
  repository?: string;
  pdb?: string;
  idprotein?: string;
  idpeptide?: string;
  idstructure?: string;
  children?: PeptideStructuresInterface[];
  expanded?: boolean;
}


@Component({
  selector: 'ngx-peptide-structures',
  templateUrl: './peptide-structures.component.html',
  styleUrls: ['./peptide-structures.component.scss'],
})

export class PeptideStructuresComponent implements OnInit {

  customColumn = 'idpeptide_structure';
  defaultColumns = ['exp_method', 'repository', 'pdb', 'idprotein',
    'idpeptide', 'idstructure'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  current_page = 1;
  count_entries: number;
  n_pags: number;
  search_form = new FormControl('');
  addPeptStruct: FormGroup;
  addStruct: FormGroup;
  putPeptStruct: FormGroup;
  putStruct: FormGroup;
  peptParam: string;
  search_term: string = '4';
  data_aux = [] as any;
  data_all = [] as any;
  aux_inter: PeptideStructuresInterface = {};
  dataSource: NbTreeGridDataSource<PeptideStructuresInterface>;

  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;

  add_form_struct: boolean = false;
  put_form_struct: boolean = false;
  add_form_ps: boolean = false;
  put_form_ps: boolean = false;

  fileUrl;
  data_print;

  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<PeptideStructuresInterface>,
              private peptidestructuresService: PeptideStructuresService,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private sanitizer: DomSanitizer,
  ) {
  }

  ngOnInit() {
    this.fetchPeptideStructure();
    this.addPeptStruct = this.formBuilder.group({
      idpeptide: new FormControl('', [
        Validators.required,
      ]),
      idpeptide_structure: new FormControl(),
      idprotein: new FormControl(),
      idstructure: new FormControl('', [
        Validators.required,
      ]),
    });
    this.addStruct = this.formBuilder.group({
      idstructure: new FormControl('', [
        Validators.required,
      ]),
      exp_method: new FormControl(),
      repository: new FormControl(),
      id_repository: new FormControl('', [
        Validators.required,
      ]),
      reference: new FormControl(),
    });
    this.addPeptStruct.patchValue({
      idpeptide_structure: '1000',
      idprotein: '2',
    });

    this.addStruct.patchValue({
      idstructure: '10000',
    });

    this.putPeptStruct = this.formBuilder.group({
      idpeptide: new FormControl('', [
        Validators.required,
      ]),
      idpeptide_structure: new FormControl(),
      idprotein: new FormControl(),
      idstructure: new FormControl('', [
        Validators.required,
      ]),
    });
    this.putStruct = this.formBuilder.group({
      idstructure: new FormControl('', [
        Validators.required,
      ]),
      exp_method: new FormControl(),
      repository: new FormControl(),
      id_repository: new FormControl('', [
        Validators.required,
      ]),
      reference: new FormControl(),
    });
  }

  fetchPeptideStructure() {
    this.peptParam = this.route.snapshot.queryParamMap.get('idpeptide');
    if (this.peptParam !== null) {
      this.search_term = this.peptParam;
    }
    this.peptidestructuresService.getFirstPage(this.search_term, this.search_form.value, this.current_page).subscribe(
      (data: Array<object>) => {
        const getters: NbGetters<PeptideStructuresInterface, PeptideStructuresInterface> = {
          dataGetter: (node: PeptideStructuresInterface) => node,
          childrenGetter: (node: PeptideStructuresInterface) => node.children || undefined,
          expandedGetter: (node: PeptideStructuresInterface) => !!node.expanded,
        };
        this.data_aux = [];
        for (let i = 0; i < data['results'].length; i++) {
          const aux = data['results'][i];
          this.aux_inter = aux;
          this.aux_inter.expanded = false;
          this.data_aux.push(this.aux_inter);
        }
        this.dataSource = this.dataSourceBuilder.create(this.data_aux, getters);
        this.count_entries = data['count'];
        this.n_pags = Math.round(this.count_entries / 10) + 1;
      });

    this.saveDataFile();

  }

  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }

  searchTableResult() {
    this.current_page = 1;
    this.fetchPeptideStructure();
  }

  // function fetches the next paginated items by using the url in the next property
  fetchNext() {
    if (this.current_page < this.n_pags) {
      this.current_page = this.current_page + 1;
    }
    this.fetchPeptideStructure();
  }

  // function fetches the previous paginated items by using the url in the previous property
  fetchPrevious() {
    if (this.current_page > 1) {
      this.current_page = this.current_page - 1;
    }
    this.fetchPeptideStructure();
  }

  // function fetches the first paginated items by using the url in the next property
  fetchFirst() {
    this.current_page = 1;
    this.fetchPeptideStructure();
  }

  // function fetches the last paginated items by using the url in the previous property
  fetchLast() {
    this.current_page = this.n_pags;
    this.fetchPeptideStructure();
  }

  onSubmitPS(put: boolean = false) {
    if (!put) {
      if (this.addPeptStruct.valid) {
        this.peptidestructuresService.add(this.addPeptStruct.value)
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      }
      // tslint:disable-next-line:one-line
      else {
        alert('Required both parameters to be filled.');
      }
    } else {
      if (this.putPeptStruct.valid) {
        this.peptidestructuresService.put(this.putPeptStruct.value, this.putPeptStruct.value['idpeptide_structure'])
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      }
      // tslint:disable-next-line:one-line
      else {
        alert('Required both parameters to be filled.');
      }
    }
  }

  onSubmitStruct(put: boolean = false) {
    if (!put) {
      if (this.addStruct.valid) {
        this.peptidestructuresService.addStruct(this.addStruct.value)
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      }
      // tslint:disable-next-line:one-line
      else {
        alert('Required at least the ID Repository parameter to be filled.');
      }
    } else {
      if (this.putStruct.valid) {
        this.peptidestructuresService.putStruct(this.putStruct.value, this.putStruct.value['idreferences'])
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      }
      // tslint:disable-next-line:one-line
      else {
        alert('Required at least the ID Repository parameter to be filled.');
      }
    }
  }

  goToUrl(newUrl, add = false): void {
    if (add === false) {
      if (newUrl !== null) {
        window.open(newUrl, '_blank');
      }
    }
    // tslint:disable-next-line:one-line
    else {
      window.open('http://localhost:8000/admin/crmapp/peptidestructures/',
        '_blank');
    }
  }

  saveDataFile() {
    /**
     customColumn = 'idpeptide_structure';
     defaultColumns = ['exp_method', 'repository', 'pdb', 'idprotein',
     'idpeptide', 'idstructure'];
     */
    this.data_all = [] as any;
    let data_to_print = 'idpeptide_structure,exp_method,repository,pdb,idprotein,idpeptide,idstructure\n';
    let peptide = '';
    if (this.peptParam !== null) {
      peptide = this.peptParam;
    }
    this.peptidestructuresService.receive_all(this.search_form.value, peptide).subscribe(
      (data: Array<object>) => {
        this.data_all = data;
        for (const i of this.data_all) {
          data_to_print = data_to_print + i['idpeptide_structure'] + ',' + i['exp_method'] + ',' + i['repository'] + ','
            + i['pdb'] + ',' + i['idprotein']
            + ',' + i['idpeptide'] + ',' + i['idstructure'] + '\n';
        }

        this.keepData(data_to_print);

        /**
        const data_send = {data: data_print};
        this.peptidestructuresService.send(data_send).subscribe(
          (data_) => {
            alert(data_['response']);
          },
          (error: HttpErrorResponse) => {
            alert(error.message);
          },
        );
        */
      },
      (error: HttpErrorResponse) => {
        alert(error.message);
      },
    );
  }

  addDataForm_ps() {
    this.add_form_ps = true;
    this.put_form_ps = false;
  }

  putDataForm_ps() {
    this.put_form_ps = true;
    this.add_form_ps = false;
  }

  addDataForm_struct() {
    this.add_form_struct = true;
    this.put_form_struct = false;
  }

  putDataForm_struct() {
    this.put_form_struct = true;
    this.add_form_struct = false;
  }

  keepData(data: string) {
    this.data_print = data;

    const blob = new Blob([this.data_print], { type: 'text/csv' });

    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));

  }
}


/**
 export class PeptideStructuresComponent implements OnInit {
  dataSource = [];
  constructor(private peptideStructuresService: PeptideStructuresService) { }
  ngOnInit() {
    this.fetchTaxonomyVirus();
  }
  fetchTaxonomyVirus() {
    this.peptideStructuresService.getFirstPage().subscribe((data: Array<object>) => { // getFirstPage(idpeptide)
      this.dataSource = data['results'];
    });
  }
  settings = {
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      idpeptide: {
        title: 'ID',
        type: 'string',
      },
      pdb: {
        title: 'PDB',
        type: 'string',
      },
    },
  };

  onDeleteConfirm(event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }

}
 */
